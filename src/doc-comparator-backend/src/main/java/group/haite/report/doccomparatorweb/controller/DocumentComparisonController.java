package group.haite.report.doccomparatorweb.controller;

import com.aspose.words.CompareOptions;
import com.fasterxml.jackson.databind.ObjectMapper;
import group.haite.report.doccomparatorweb.util.DocumentComparator;
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
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/compare")
public class DocumentComparisonController {

    private static final String UPLOAD_DIR = "uploads/";
    private static final String OUTPUT_DIR = "outputs/";

    private static final Map<String, String> fileMap = new ConcurrentHashMap<>();

    // 添加 OPTIONS 请求处理 - 用于 CORS 预检请求
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
        CompareOptions options = parseCompareOptions(optionsJson);

        // 保存上传的文件
        String file1Path = saveUploadedFile(file1, uploadPath);
        String file2Path = saveUploadedFile(file2, uploadPath);
        String outputFilePath = outputPath.resolve("comparison_result." + format.toLowerCase()).toString();

        try {
            // 执行文档比较
            int diffCount = DocumentComparator.compareDocuments(file1Path, file2Path, outputFilePath, options);

            // 验证生成的文件
            File resultFile = new File(outputFilePath);
            if (!resultFile.exists()) {
                throw new RuntimeException("生成的文档文件不存在");
            }

            if (resultFile.length() == 0) {
                throw new RuntimeException("生成的文档文件为空");
            }

            System.out.println("文档生成完成 - 格式: " + format + ", 大小: " + resultFile.length() + " 字节");

            // 只在 DOCX 格式时进行 DOCX 格式验证
            if (format.equalsIgnoreCase("DOCX")) {
                System.out.println("执行DOCX格式验证");

                // 详细验证 DOCX 文件格式
                try (FileInputStream fis = new FileInputStream(resultFile)) {
                    byte[] header = new byte[8];
                    int read = fis.read(header);

                    System.out.println("文件头(HEX): " + bytesToHex(header));

                    // DOCX 应该是 ZIP 格式 (PK header)
                    boolean isZip = header[0] == 0x50 && header[1] == 0x4B && header[2] == 0x03 && header[3] == 0x04;
                    System.out.println("是否是有效的ZIP格式: " + isZip);

                    if (!isZip) {
                        System.err.println("错误: 文件不是有效的DOCX格式");
                        System.err.println("期望: PK\\x03\\x04 (ZIP格式)");
                        System.err.println("实际: " + bytesToHex(header));
                        throw new RuntimeException("生成的文档不是有效的DOCX格式");
                    }
                }

                System.out.println("DOCX文档验证通过");
            } else {
                // 对于 HTML/PDF 格式，只进行基本验证
                System.out.println(format + "格式文档生成成功，跳过DOCX格式验证");
            }

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
            return ResponseEntity.status(500).body("比较文档时出错: " + e.getMessage());
        } finally {
            // 清理临时文件（可选，也可以设置定时任务清理）
//         cleanupTempFiles(uploadPath, outputPath);
        }
    }

    // 字节转十六进制的方法
    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X ", b));
        }
        return sb.toString().trim();
    }

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

    private String saveUploadedFile(MultipartFile file, Path directory) throws IOException {
        String filename = file.getOriginalFilename();
        Path filePath = directory.resolve(filename);
        Files.copy(file.getInputStream(), filePath);
        return filePath.toString();
    }

    private void cleanupTempFiles(Path... paths) throws IOException {
        for (Path path : paths) {
            Files.walk(path)
                    .sorted((a, b) -> -a.compareTo(b))
                    .map(Path::toFile)
                    .forEach(File::delete);
        }
    }

    private CompareOptions parseCompareOptions(String optionsJson) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, Boolean> optionsMap = objectMapper.readValue(optionsJson, Map.class);

            CompareOptions options = new CompareOptions();
            options.setIgnoreFormatting(getBooleanOption(optionsMap, "ignoreFormatting", true));
            options.setIgnoreHeadersAndFooters(getBooleanOption(optionsMap, "ignoreHeadersAndFooters", true));
            options.setIgnoreCaseChanges(getBooleanOption(optionsMap, "ignoreCaseChanges", true));
            options.setIgnoreTables(getBooleanOption(optionsMap, "ignoreTables", true));
            options.setIgnoreFields(getBooleanOption(optionsMap, "ignoreFields", true));
            options.setIgnoreComments(getBooleanOption(optionsMap, "ignoreComments", true));
            options.setIgnoreTextboxes(getBooleanOption(optionsMap, "ignoreTextboxes", true));
            options.setIgnoreFootnotes(getBooleanOption(optionsMap, "ignoreFootnotes", true));

            return options;
        } catch (Exception e) {
            // 如果解析失败，返回默认选项
            return DocumentComparator.createDefaultCompareOptions();
        }
    }

    private boolean getBooleanOption(Map<String, Boolean> optionsMap, String key, boolean defaultValue) {
        return optionsMap.containsKey(key) ? optionsMap.get(key) : defaultValue;
    }
}