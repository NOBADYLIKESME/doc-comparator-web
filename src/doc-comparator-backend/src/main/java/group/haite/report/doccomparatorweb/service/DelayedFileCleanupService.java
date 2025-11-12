package group.haite.report.doccomparatorweb.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
public class DelayedFileCleanupService {
    
    // 存储文件路径和计划删除时间的映射
    private final Map<String, LocalDateTime> scheduledDeletions = new ConcurrentHashMap<>();
    
    // 存储sessionId和对应的路径
    private final Map<String, Path[]> sessionPaths = new ConcurrentHashMap<>();
    
    /**
     * 添加延迟删除任务
     * @param sessionId 会话ID
     * @param delayMinutes 延迟分钟数
     * @param paths 要删除的路径数组
     */
    public void scheduleCleanup(String sessionId, long delayMinutes, Path... paths) {
        LocalDateTime deleteTime = LocalDateTime.now().plus(delayMinutes, ChronoUnit.MINUTES);
        scheduledDeletions.put(sessionId, deleteTime);
        sessionPaths.put(sessionId, paths);
        System.out.println("已安排删除任务: sessionId=" + sessionId + ", 删除时间=" + deleteTime);
    }
    
    /**
     * 定时任务：每分钟检查并执行到期的删除任务
     */
    @Scheduled(fixedRate = 60000) // 每分钟执行一次
    public void performScheduledCleanup() {
        LocalDateTime now = LocalDateTime.now();
        System.out.println("执行定时清理任务，当前时间: " + now);
        
        // 查找所有到期的删除任务
        scheduledDeletions.entrySet().removeIf(entry -> {
            String sessionId = entry.getKey();
            LocalDateTime deleteTime = entry.getValue();
            
            if (now.isAfter(deleteTime) || now.isEqual(deleteTime)) {
                // 执行删除操作
                Path[] paths = sessionPaths.get(sessionId);
                if (paths != null) {
                    cleanupTempFiles(paths);
                    sessionPaths.remove(sessionId);
                    System.out.println("已执行删除任务: sessionId=" + sessionId);
                }
                return true; // 移除此项
            }
            return false; // 保留此项
        });
    }
    
    /**
     * 立即清理临时文件
     * @param paths 要删除的路径数组
     */
    private void cleanupTempFiles(Path... paths) {
        try {
            for (Path path : paths) {
                if (Files.exists(path)) {
                    Files.walk(path)
                            .sorted((a, b) -> -a.compareTo(b))
                            .map(Path::toFile)
                            .forEach(File::delete);
                    System.out.println("已删除临时目录: " + path);
                }
            }
        } catch (Exception e) {
            System.err.println("清理临时文件时出错: " + e.getMessage());
            e.printStackTrace();
        }
    }
}