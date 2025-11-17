package group.haite.report.doccomparatorweb.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Iterator;

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
     * 定时任务：每10秒检查并执行到期的删除任务
     */
    @Scheduled(fixedRate = 600000) // 每10秒执行一次，提高响应性
    public void performScheduledCleanup() {
        LocalDateTime now = LocalDateTime.now();
        
        if (scheduledDeletions.isEmpty()) {
            return;
        }
        
        System.out.println("开始执行定时清理任务，当前计划任务数: " + scheduledDeletions.size());
        
        // 使用迭代器安全地移除元素
        Iterator<Map.Entry<String, LocalDateTime>> iterator = scheduledDeletions.entrySet().iterator();
        int cleanedTasks = 0;
        while (iterator.hasNext()) {
            Map.Entry<String, LocalDateTime> entry = iterator.next();
            String sessionId = entry.getKey();
            LocalDateTime deleteTime = entry.getValue();
            
            if (now.isAfter(deleteTime) || now.isEqual(deleteTime)) {
                // 执行删除操作
                Path[] paths = sessionPaths.get(sessionId);
                if (paths != null) {
                    System.out.println("开始清理会话资源: " + sessionId);
                    cleanupTempFiles(paths);
                    sessionPaths.remove(sessionId);
                    System.out.println("已完成清理会话资源: " + sessionId);
                }
                iterator.remove(); // 安全地移除元素
                cleanedTasks++;
            }
        }
        
        if (cleanedTasks > 0) {
            System.out.println("本次清理任务完成，共清理 " + cleanedTasks + " 个任务");
        }
    }
    
    /**
     * 立即清理临时文件
     * @param paths 要删除的路径数组
     */
    public void cleanupTempFiles(Path... paths) {
        try {
            for (Path path : paths) {
                if (Files.exists(path)) {
                    System.out.println("开始删除目录: " + path);
                    Files.walk(path)
                            .sorted((a, b) -> -a.compareTo(b))
                            .map(Path::toFile)
                            // 使用安全删除方法
                            .forEach(this::safeDelete);
                    System.out.println("已完成删除目录: " + path);
                }
            }
        } catch (Exception e) {
            System.err.println("清理临时文件时出错: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * 安全删除文件的方法，避免StackOverflowError
     */
    private void safeDelete(File file) {
        try {
            if (file != null && file.exists()) {
                boolean deleted = file.delete();
                if (!deleted) {
                    System.err.println("未能删除文件: " + file.getAbsolutePath());
                } else {
                    System.out.println("已删除文件: " + file.getAbsolutePath());
                }
            }
        } catch (Exception e) {
            System.err.println("删除文件时出错: " + e.getMessage());
        }
    }
    
    /**
     * 获取当前计划任务数量
     * @return 任务数量
     */
    public int getScheduledTaskCount() {
        return scheduledDeletions.size();
    }
    
    /**
     * 立即清理指定会话的资源
     * @param sessionId 会话ID
     */
    public void immediateCleanup(String sessionId) {
        try {
            LocalDateTime deleteTime = scheduledDeletions.remove(sessionId);
            if (deleteTime != null) {
                Path[] paths = sessionPaths.remove(sessionId);
                if (paths != null) {
                    System.out.println("立即清理会话资源: " + sessionId);
                    cleanupTempFiles(paths);
                    System.out.println("已完成立即清理会话资源: " + sessionId);
                }
            }
        } catch (Exception e) {
            System.err.println("立即清理会话资源时出错: " + e.getMessage());
            e.printStackTrace();
        }
    }
}