#!/bin/bash

# 进入 out/cache 目录
cd out/cache

# 列出所有文件按修改时间排序，只保留最新的1000个文件
find . -type f -printf '%T@ %p\n' | sort -n | head -n -1000 | cut -d' ' -f2- | xargs -r rm

# 显示删除后的文件数量
echo "当前缓存文件数量：$(find . -type f | wc -l)"
