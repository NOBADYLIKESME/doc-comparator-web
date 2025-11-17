# 第一阶段：构建前端应用
# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine AS build

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 使用Nginx作为生产服务器
FROM nginx:alpine

# 复制构建好的文件到Nginx目录
COPY --from=build /app/build /usr/share/nginx/html

# 复制自定义Nginx配置（包含后端API代理）
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]

# 第二阶段：构建并运行Spring Boot应用
FROM udayglobuslive/ubuntu-openjdk17-maven-node-az:latest
WORKDIR /app

# 设置UTF-8字符编码环境变量
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV JAVA_TOOL_OPTIONS="-Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8"

# 安装中文字体以支持PDF中文显示
RUN apt-get update && apt-get install -y --no-install-recommends fonts-wqy-zenhei fonts-wqy-microhei fonts-noto-cjk fonts-arphic-uming fonts-arphic-ukai fonts-ipafont-gothic fonts-ipafont-mincho locales-all
RUN fc-cache -fv

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

# 复制Maven包装器和pom.xml
COPY mvnw .
COPY .mvn/ .mvn/
COPY pom.xml .

# 复制源代码
COPY src/ ./src/

# 复制依赖库并安装到本地仓库（避免systemPath警告）
COPY lib/ ./lib/
RUN mvn install:install-file -Dfile=lib/aspose-words-20.12-jdk17-cracked.jar -DgroupId=com.aspose -DartifactId=ryan-words -Dversion=20.12 -Dpackaging=jar

# 构建应用
RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests --settings /root/.m2/settings.xml

# 暴露端口
EXPOSE 8080

# 创建必要的目录
RUN mkdir -p /app/uploads /app/outputs

# 运行应用
CMD ["java", "-Dfile.encoding=UTF-8", "-Dsun.jnu.encoding=UTF-8", "-jar", "target/doc-comparator-web-0.0.1-SNAPSHOT.jar"]