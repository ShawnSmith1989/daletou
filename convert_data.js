// 这个Node.js脚本用于将dlt_all.txt转换为适合Web使用的JavaScript数据文件

const fs = require('fs');
const path = require('path');

// 读取原始数据文件
const inputFile = path.join(__dirname, 'dlt_all.txt');
const outputFile = path.join(__dirname, 'data.js');

try {
    // 读取文件内容
    const fileContent = fs.readFileSync(inputFile, 'utf8');
    
    // 解析数据
    const lines = fileContent.trim().split('\n');
    const lotteryData = [];
    
    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 9) {
            const period = parts[0];
            const date = parts[1];
            const frontNumbers = parts.slice(2, 7).map(n => parseInt(n));
            const backNumbers = parts.slice(7, 9).map(n => parseInt(n));
            
            lotteryData.push({
                period,
                date,
                frontNumbers,
                backNumbers,
                rawData: parts.slice(0, 9).join(' ') // 保存原始数据部分
            });
        }
    }
    
    // 生成JavaScript文件
    const jsContent = `// 大乐透历史数据
// 自动生成于 ${new Date().toISOString()}

const lotteryData = ${JSON.stringify(lotteryData, null, 2)};

// 导出数据（不同模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = lotteryData;
} else if (typeof window !== 'undefined') {
    window.lotteryData = lotteryData;
}
`;
    
    // 写入JavaScript文件
    fs.writeFileSync(outputFile, jsContent, 'utf8');
    
    console.log(`成功转换 ${lotteryData.length} 条记录到 ${outputFile}`);
    
} catch (error) {
    console.error('转换数据时出错:', error);
}