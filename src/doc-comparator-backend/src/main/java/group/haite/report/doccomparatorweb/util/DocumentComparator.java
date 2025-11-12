package group.haite.report.doccomparatorweb.util;

import com.aspose.words.*;
import java.util.Date;


/**
 * 文档比较工具类
 * 提供文档比较功能，支持HTML、PDF、DOCX格式
 * @author ryan
 */
public class DocumentComparator {
    
    /**
     * 比较两个文档并将结果保存到指定路径
     * 
     * @param doc1Path 第一个文档路径
     * @param doc2Path 第二个文档路径
     * @param outputPath 输出文件路径
     * @param options 比较选项
     * @return 发现的差异数量
     * @throws Exception 比较过程中可能发生的异常
     */
    public static int compareDocuments(String doc1Path, String doc2Path, String outputPath, CompareOptions options) throws Exception {
        // 创建文档对象
        Document doc1 = new Document(doc1Path);
        Document doc2 = new Document(doc2Path);
        
        // 执行比较
        // 注意：Aspose.Words的compare方法在新版本中不返回差异数量
        // 但可以通过统计修订数量来获取
        doc1.compare(doc2, "文档比较", new Date(), options);
        
        // 保存结果
        int saveFormat;
        if (outputPath.toLowerCase().endsWith(".docx")) {
            saveFormat = SaveFormat.DOCX;
        } else if (outputPath.toLowerCase().endsWith(".pdf")) {
            saveFormat = SaveFormat.PDF;
        } else {
            saveFormat = SaveFormat.HTML;
        }
        
        doc1.save(outputPath, saveFormat);
        
        // 返回修订数量作为差异数量
        return doc1.getRevisions().getCount();
    }
    
    /**
     * 创建默认的比较选项
     * 
     * @return 默认的比较选项
     */
    public static CompareOptions createDefaultCompareOptions() {
        CompareOptions options = new CompareOptions();
        options.setIgnoreFormatting(true);
        options.setIgnoreHeadersAndFooters(true);
        options.setIgnoreCaseChanges(true);
        options.setIgnoreTables(true);
        options.setIgnoreFields(true);
        options.setIgnoreComments(true);
        options.setIgnoreTextboxes(true);
        options.setIgnoreFootnotes(true);
        return options;
    }
}