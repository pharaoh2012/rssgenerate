#!/bin/sh

# 定义函数：执行JS文件
runscript() {
    JS_FILE=$1  # 获取第一个参数作为JS文件路径
    if [ -f "$JS_FILE" ]; then
        # 记录开始时间
        START_TIME=$(date +%s)
        echo "🟢🟢🟢🟢正在执行: $JS_FILE"

        node "$JS_FILE" || true

        END_TIME=$(date +%s)
        EXECUTION_TIME=$((END_TIME - START_TIME))
        echo "🔵🔵🔵🔵脚本执行时间: $EXECUTION_TIME 秒"        
    else
        echo "警告: 文件不存在或路径错误: $JS_FILE"
    fi
}

# 调用 runscript 函数执行指定的JS文件
runscript "./rss/0818tuan.js"
# runscript "./rss/51credit.js"
runscript "./rss/52pojie.js"
runscript "./rss/cnblogs.js"
runscript "./rss/juejin.js"
runscript "./rss/smzdm.js"
runscript "./rss/52pojie_aiqiyi.js"
