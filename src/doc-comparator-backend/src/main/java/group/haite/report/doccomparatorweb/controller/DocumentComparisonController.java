package group.haite.report.doccomparatorweb.controller;

import com.aspose.words.CompareOptions;
import group.haite.report.doccomparatorweb.service.DelayedFileCleanupService;
import group.haite.report.doccomparatorweb.service.DocumentComparisonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.InputStreamResource;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.Collections;
import java.util.WeakHashMap;

/**
 * 文档比较控制器
 * 提供文档上传、比较、预览等相关API接口
 *
 * @author ryan
 * @version 1.0
 * @since 2025-11-12
 */
@RestController
@RequestMapping("/api/compare")
public class DocumentComparisonController {

    /**
     * 上传文件目录，用于存储上传的文档文件
     * 生产环境需要配置为绝对路径，避免文件上传路径泄露
     */
    private static final String UPLOAD_DIR = "uploads/";
    
    /**
     * 输出文件目录，用于存储比较生成的文档文件
     * 生产环境需要配置为绝对路径，避免文件路径泄露
     */
    private static final String OUTPUT_DIR = "outputs/";

    /**
     * 文件ID与文件路径映射关系
     * 使用 WeakHashMap 避免内存泄漏，并包装为 synchronizedMap 保证线程安全
     */
    private static final Map<String, String> fileMap = Collections.synchronizedMap(new WeakHashMap<>());
    
    /**
     * 延迟文件清理服务
     */
    @Autowired
    private DelayedFileCleanupService delayedFileCleanupService;
    
    /**
     * 文档比较服务
     */
    @Autowired
    private DocumentComparisonService documentComparisonService;

    /**
     * 处理CORS预检请求
     *
     * @param fileId 文件ID
     * @return 响应实体
     */
    @RequestMapping(value = "/preview/{fileId}", method = RequestMethod.OPTIONS)
    public ResponseEntity<?> handleOptions(@PathVariable String fileId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Origin, X-Requested-With, Range");
        headers.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Content-Type, Accept-Ranges, Last-Modified, ETag");
        headers.set("Access-Control-Max-Age", "3600");
        return ResponseEntity.ok().headers(headers).build();
    }
    
    /**
     * 比较两个文档
     *
     * @param file1 待比较的第一个文件
     * @param file2 待比较的第二个文件
     * @param format 输出格式(PDF/DOCX/HTML)
     * @param optionsJson 比较选项的JSON字符串
     * @return 比较结果
     * @throws IOException IO异常
     */
    @PostMapping
    public ResponseEntity<?> compareDocuments(
            @RequestParam("file1") MultipartFile file1,
            @RequestParam("file2") MultipartFile file2,
            @RequestParam("format") String format,
            @RequestParam("options") String optionsJson) throws IOException {

        System.out.println("接收到的format参数值: " + format);

        // 创建临时目录
        String sessionId = UUID.randomUUID().toString();
        Path uploadPath = Paths.get(UPLOAD_DIR + sessionId);
        Path outputPath = Paths.get(OUTPUT_DIR + sessionId);
        Files.createDirectories(uploadPath);
        Files.createDirectories(outputPath);

        // 解析比较选项
        CompareOptions options = documentComparisonService.parseCompareOptions(optionsJson);

        // 保存上传的文件
        String file1Path = saveUploadedFile(file1, uploadPath);
        String file2Path = saveUploadedFile(file2, uploadPath);
        String outputFilePath = outputPath.resolve("对比结果." + format.toLowerCase()).toString();

        try {
            // 执行文档比较
            int diffCount = documentComparisonService.compareDocuments(file1Path, file2Path, outputFilePath, options);

            // 验证生成的文件
            documentComparisonService.validateGeneratedFile(outputFilePath, format);

            // 对于DOCX格式，返回预览URL信息
            if (format.equalsIgnoreCase("DOCX")) {
                System.out.println("执行DOCX格式处理逻辑");

                // 为文件创建一个唯一标识
                String fileId = "doc_" + UUID.randomUUID().toString();

                // 存储文件路径和ID的映射关系
                fileMap.put(fileId, outputFilePath);

                // 构建返回结果
                Map<String, String> result = new HashMap<>();
                result.put("type", "docx");
                result.put("fileId", fileId);

                return ResponseEntity.ok(result);
            }
            // 对于其他格式，仍然返回文件内容
            else {
                System.out.println("执行其他格式处理逻辑: " + format);

                // 返回比较结果文件
                File resultFile = new File(outputFilePath);
                InputStreamResource resource = new InputStreamResource(new FileInputStream(resultFile));
                HttpHeaders headers = new HttpHeaders();

                // 根据不同格式设置不同的Content-Type
                MediaType mediaType;
                if (format.equalsIgnoreCase("PDF")) {
                    mediaType = MediaType.APPLICATION_PDF;
                } else if (format.equalsIgnoreCase("HTML")) {
                    mediaType = MediaType.TEXT_HTML;
                } else {
                    mediaType = MediaType.APPLICATION_OCTET_STREAM;
                }

                // 设置为内联显示而非附件下载
                headers.setContentDisposition(ContentDisposition.inline().filename("comparison_result." + format.toLowerCase()).build());

                return ResponseEntity.ok()
                        .headers(headers)
                        .contentLength(resultFile.length())
                        .contentType(mediaType)
                        .body(resource);
            }
        } catch (Exception e) {
            e.printStackTrace();
            // 发生异常时立即清理文件
            documentComparisonService.cleanupTempFiles(uploadPath, outputPath);
            return ResponseEntity.status(500).body("比较文档时出错: " + e.getMessage());
        } finally {
            // 安排1分钟后删除临时文件
            delayedFileCleanupService.scheduleCleanup(sessionId, 1, uploadPath, outputPath);
        }
    }

    /**
     * 预览文档
     *
     * @param fileId 文件ID
     * @return 文件内容响应实体
     */
    @GetMapping("/preview/{fileId}")
    public ResponseEntity<byte[]> previewFile(@PathVariable String fileId) {
        try {
            String filePath = fileMap.get(fileId);
            if (filePath == null) {
                return ResponseEntity.status(404).build();
            }

            File file = new File(filePath);
            if (!file.exists()) {
                return ResponseEntity.status(404).build();
            }

            // 读取文件内容
            byte[] fileContent = Files.readAllBytes(file.toPath());

            HttpHeaders headers = new HttpHeaders();

            // 使用标准的 CORS 头（大写）
            headers.set("Access-Control-Allow-Origin", "*");
            headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
            headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Origin, X-Requested-With, Range");
            headers.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Content-Type, Accept-Ranges, Last-Modified, ETag");

            // 设置缓存控制
            headers.setCacheControl(CacheControl.noCache());
            headers.setPragma("no-cache");
            headers.setExpires(0L);

            // 设置内容类型
            headers.setContentType(MediaType.valueOf("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));

            // 设置内容处置
            headers.setContentDisposition(ContentDisposition.inline().filename("comparison_result.docx").build());

            // 支持范围请求
            headers.set("Accept-Ranges", "bytes");

            // 添加 Last-Modified 头
            headers.setLastModified(file.lastModified());

            // 添加 ETag 头
            headers.setETag("\"" + file.length() + "-" + file.lastModified() + "\"");

            // 设置内容长度
            headers.setContentLength(fileContent.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(fileContent);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * 当用户关闭预览时调用此方法清理资源
     *
     * @param fileId 文件ID
     * @return 响应实体
     */
    @DeleteMapping("/preview/{fileId}")
    public ResponseEntity<?> closePreview(@PathVariable String fileId) {
        try {
            // 从 fileMap 中移除条目
            String filePath = fileMap.remove(fileId);
            if (filePath != null) {
                System.out.println("已清理预览资源: " + fileId + " -> " + filePath);
            } else {
                System.out.println("未找到预览资源: " + fileId);
            }
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("清理预览资源时出错: " + e.getMessage());
        }
    }

    /**
     * 保存上传的文件到指定目录
     *
     * @param file 上传的文件
     * @param directory 目标目录
     * @return 文件保存路径
     * @throws IOException IO异常
     */
    private String saveUploadedFile(MultipartFile file, Path directory) throws IOException {
        String filename = file.getOriginalFilename();
        Path filePath = directory.resolve(filename);
        Files.copy(file.getInputStream(), filePath);
        return filePath.toString();
    }
}