package group.haite.report.doccomparatorweb.controller;

import com.aspose.words.CompareOptions;
import com.fasterxml.jackson.databind.ObjectMapper;
import group.haite.report.doccomparatorweb.util.DocumentComparator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;


@RestController
@RequestMapping("/api/compare")
public class DocumentComparisonController {


    private static final String UPLOAD_DIR = "uploads/";
    private static final String OUTPUT_DIR = "outputs/";

    @PostMapping
    public ResponseEntity<?> compareDocuments(
            @RequestParam("file1") MultipartFile file1,
            @RequestParam("file2") MultipartFile file2,
            @RequestParam("format") String format,
            @RequestParam("options") String optionsJson) throws IOException {

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
            } else if (format.equalsIgnoreCase("DOCX")) {
                mediaType = MediaType.valueOf("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            } else {
                mediaType = MediaType.APPLICATION_OCTET_STREAM;
            }

            // 设置为内联显示而非附件下载
            headers.add("Content-Disposition", "inline; filename=comparison_result." + format.toLowerCase());

            return ResponseEntity.ok()
                    .headers(headers)
                    .contentLength(resultFile.length())
                    .contentType(mediaType)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("比较文档时出错: " + e.getMessage());
        } finally {
            // 清理临时文件（可选，也可以设置定时任务清理）
            // cleanupTempFiles(uploadPath, outputPath);
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