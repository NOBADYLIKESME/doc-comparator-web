package group.haite.report.doccomparatorweb.service;

import com.aspose.words.CompareOptions;
import group.haite.report.doccomparatorweb.util.DocumentComparator;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

/**
 * 文档比较服务类
 * 提供文档比较、验证、清理等相关业务逻辑处理
 *
 * @author ryan
 * @version 1.0
 * @since 2025-11-12
 */
@Service
public class DocumentComparisonService {
    
    /**
     * 比较两个文档并返回差异数量
     *
     * @param doc1Path 第一个文档路径
     * @param doc2Path 第二个文档路径
     * @param outputPath 输出文件路径
     * @param options 比较选项
     * @return 文档差异数量
     * @throws Exception 文档比较异常
     */
    public int compareDocuments(String doc1Path, String doc2Path, String outputPath, CompareOptions options) throws Exception {
        return DocumentComparator.compareDocuments(doc1Path, doc2Path, outputPath, options);
    }

    /**
     * 创建默认的比较选项
     *
     * @return 默认比较选项
     */
    public CompareOptions createDefaultCompareOptions() {
        return DocumentComparator.createDefaultCompareOptions();
    }
    
    /**
     * 验证生成的文档文件
     *
     * @param outputFilePath 输出文件路径
     * @param format 文件格式
     * @throws IOException IO异常
     */
    public void validateGeneratedFile(String outputFilePath, String format) throws IOException {
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
    }
    
    /**
     * 将字节数组转换为十六进制字符串
     *
     * @param bytes 字节数组
     * @return 十六进制字符串
     */
    public String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X ", b));
        }
        return sb.toString().trim();
    }
    
    /**
     * 清理临时文件
     *
     * @param paths 需要清理的文件路径数组
     */
    public void cleanupTempFiles(Path... paths) {
        try {
            for (Path path : paths) {
                Files.walk(path)
                        .sorted((a, b) -> -a.compareTo(b))
                        .map(Path::toFile)
                        .forEach(File::delete);
            }
        } catch (IOException e) {
            System.err.println("清理临时文件时出错: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * 解析比较选项JSON字符串
     *
     * @param optionsJson 比较选项的JSON字符串
     * @return 比较选项对象
     */
    public CompareOptions parseCompareOptions(String optionsJson) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
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
            return createDefaultCompareOptions();
        }
    }
    
    /**
     * 从选项映射中获取布尔值，如果不存在则返回默认值
     *
     * @param optionsMap 选项映射
     * @param key 键名
     * @param defaultValue 默认值
     * @return 布尔值
     */
    private boolean getBooleanOption(Map<String, Boolean> optionsMap, String key, boolean defaultValue) {
        return optionsMap.containsKey(key) ? optionsMap.get(key) : defaultValue;
    }
}