# 第一阶段：构建前端应用
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend

# 复制前端package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制前端源码
COPY src/ ./src/
COPY public/ ./public/

# 构建前端应用
RUN npm run build && ls -la ./build/ || echo "Build failed"

# 第一阶段：准备前端静态文件（直接使用已有的build目录）
FROM busybox AS frontend-prep
WORKDIR /app

# 直接复制已有的build目录到镜像中
COPY ./build /app/build

# 第二阶段：构建并运行Spring Boot应用
FROM udayglobuslive/ubuntu-openjdk17-maven-node-az:latest
WORKDIR /app

# 设置UTF-8字符编码环境变量
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV JAVA_TOOL_OPTIONS="-Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8"

# 安装中文字体以支持PDF中文显示
RUN apt-get update && apt-get install -y --no-install-recommends fonts-wqy-zenhei fonts-wqy-microhei fonts-noto-cjk fonts-arphic-uming fonts-arphic-ukai fonts-ipafont-gothic fonts-ipafont-mincho locales-all && \
    rm -rf /var/lib/apt/lists/* && \
    fc-cache -fv

# 创建Maven配置文件使用国内镜像源
RUN mkdir -p /root/.m2
COPY <<EOF /root/.m2/settings.xml
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd">
  <mirrors>
    <mirror>
      <id>aliyunmaven</id>
      <mirrorOf>*</mirrorOf>
      <name>阿里云公共仓库</name>
      <url>https://maven.aliyun.com/repository/public</url>
    </mirror>
    <mirror>
      <id>huaweicloud</id>
      <mirrorOf>*</mirrorOf>
      <name>华为云公共仓库</name>
      <url>https://repo.huaweicloud.com/repository/maven/</url>
    </mirror>
  </mirrors>
</settings>
EOF

# 复制后端文件
COPY src/doc-comparator-backend/pom.xml .
COPY src/doc-comparator-backend/src/ ./src/
COPY src/doc-comparator-backend/lib/ ./lib/

# 创建静态资源目录并复制前端文件
RUN mkdir -p src/main/resources/static
COPY --from=frontend-prep /app/build/ src/main/resources/static/

# 调试：验证静态资源是否正确复制
RUN echo "Verifying static resources..."
RUN ls -la src/main/resources/static/ || echo "Static resources not copied"

# 使用已安装的maven而不是mvnw，避免下载过程
RUN mvn install:install-file -Dfile=lib/aspose-words-20.12-jdk17-cracked.jar -DgroupId=com.aspose -DartifactId=ryan-words -Dversion=20.12 -Dpackaging=jar
RUN mvn clean package -DskipTests --settings /root/.m2/settings.xml

# 创建必要的目录
RUN mkdir -p /app/uploads /app/outputs

# 设置环境变量
ENV SPRING_PROFILES_ACTIVE=prod
ENV UPLOAD_DIR=/app/uploads
ENV OUTPUT_DIR=/app/outputs

# 暴露端口
EXPOSE 8080

# 运行应用
CMD ["java", "-Dfile.encoding=UTF-8", "-Dsun.jnu.encoding=UTF-8", "-jar", "target/doc-comparator-web-0.0.1-SNAPSHOT.jar"]