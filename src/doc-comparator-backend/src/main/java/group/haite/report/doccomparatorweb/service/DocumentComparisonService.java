package group.haite.report.doccomparatorweb.service;

import com.aspose.words.CompareOptions;
import group.haite.report.doccomparatorweb.util.DocumentComparator;
import org.springframework.stereotype.Service;

@Service
public class DocumentComparisonService {
    /**
     * 比较两个文档并返回差异数量
     */
    public int compareDocuments(String doc1Path, String doc2Path, String outputPath, CompareOptions options) throws Exception {
        return DocumentComparator.compareDocuments(doc1Path, doc2Path, outputPath, options);
    }

    /**
     * 创建默认的比较选项
     */
    public CompareOptions createDefaultCompareOptions() {
        return DocumentComparator.createDefaultCompareOptions();
    }
}
