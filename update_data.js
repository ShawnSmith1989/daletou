// 更新大乐透数据的脚本
// 从网络获取最新开奖数据，并合并到现有数据中

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 文件路径
const dataFile = path.join(__dirname, 'data.js');
const rawDataFile = path.join(__dirname, 'dlt_all.txt');

// 获取最新数据的API
const API_URL = 'https://webapi.sporttery.cn/gateway/lottery/getHistoryPageListV1.qry?gameNo=85&provinceId=0&pageSize=100&isVerify=1&pageNo=1';

// 读取现有数据
function readExistingData() {
    try {
        // 尝试读取data.js文件
        if (fs.existsSync(dataFile)) {
            const dataContent = fs.readFileSync(dataFile, 'utf8');
            // 提取lotteryData数组
            const dataMatch = dataContent.match(/const lotteryData = (\[[\s\S]*?\]);/);
            if (dataMatch && dataMatch[1]) {
                return JSON.parse(dataMatch[1]);
            }
        }
    } catch (error) {
        console.error('读取现有数据失败:', error.message);
    }
    return [];
}

// 读取原始数据
function readRawData() {
    try {
        if (fs.existsSync(rawDataFile)) {
            const content = fs.readFileSync(rawDataFile, 'utf8');
            return content.trim();
        }
    } catch (error) {
        console.error('读取原始数据失败:', error.message);
    }
    return '';
}

// 获取网络数据
function fetchLatestData() {
    return new Promise((resolve, reject) => {
        const protocol = API_URL.startsWith('https') ? https : http;
        
        const req = protocol.get(API_URL, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('API响应结构:', JSON.stringify(response, null, 2).substring(0, 500) + '...');
                    
                    // 检查多种可能的数据结构
                    if (response.success && response.data && response.data.list) {
                        resolve(response.data.list);
                    } else if (response.success && response.data && response.data.result) {
                        resolve(response.data.result);
                    } else if (response.success && response.value && response.value.list) {
                        resolve(response.value.list);
                    } else if (response.data) {
                        // 如果是直接的数组
                        if (Array.isArray(response.data)) {
                            resolve(response.data);
                        } else if (typeof response.data === 'object') {
                            // 尝试找到数组字段
                            for (const key in response.data) {
                                if (Array.isArray(response.data[key])) {
                                    resolve(response.data[key]);
                                }
                            }
                            reject(new Error('API返回数据中未找到数组字段'));
                        } else {
                            reject(new Error('API返回data字段格式不正确'));
                        }
                    } else {
                        reject(new Error('API返回数据格式不正确'));
                    }
                } catch (error) {
                    reject(new Error('解析API数据失败: ' + error.message));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(new Error('网络请求失败: ' + error.message));
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('请求超时'));
        });
    });
}

// 转换API数据格式为标准格式
function convertApiData(apiData) {
    return apiData.map(item => {
        // 检查数据结构 - 根据调试输出，我们看到了 value 字段
        let lotteryDrawNum, lotteryDrawResult, lotteryDrawTime;
        
        // 尝试从不同可能的结构中提取数据
        if (item.lotteryDrawNum !== undefined) {
            lotteryDrawNum = item.lotteryDrawNum;
            lotteryDrawResult = item.lotteryDrawResult;
            lotteryDrawTime = item.lotteryDrawTime;
        } else if (item.drawNum !== undefined) {
            lotteryDrawNum = item.drawNum;
            lotteryDrawResult = item.drawResult;
            lotteryDrawTime = item.drawTime;
        } else if (item.lottery && item.lottery.lotteryDrawNum) {
            lotteryDrawNum = item.lottery.lotteryDrawNum;
            lotteryDrawResult = item.lottery.lotteryDrawResult;
            lotteryDrawTime = item.lottery.lotteryDrawTime;
        }
        
        // 从 lotteryDrawResult 字符串中提取前区和后区号码
        if (!lotteryDrawResult) {
            console.warn('未找到开奖结果字段', item);
            return null;
        }
        
        const numbers = lotteryDrawResult.split(' ');
        if (numbers.length < 7) {
            console.warn('开奖结果格式不正确', lotteryDrawResult);
            return null;
        }
        
        const frontNumbers = numbers.slice(0, 5).map(n => parseInt(n));
        const backNumbers = numbers.slice(5, 7).map(n => parseInt(n));
        
        return {
            period: lotteryDrawNum,
            date: lotteryDrawTime.split(' ')[0],
            frontNumbers,
            backNumbers,
            rawData: `${lotteryDrawNum} ${lotteryDrawTime.split(' ')[0]} ${numbers.join(' ')}`
        };
    }).filter(item => item !== null); // 过滤掉无效的项
}

// 合并新旧数据
function mergeData(existingData, newData) {
    // 创建现有数据的期号集合
    const existingPeriods = new Set(existingData.map(item => item.period));
    
    // 过滤出不在现有数据中的新数据
    const filteredNewData = newData.filter(item => !existingPeriods.has(item.period));
    
    if (filteredNewData.length === 0) {
        return { mergedData: existingData, newCount: 0 };
    }
    
    // 合并数据（新数据在前）
    const mergedData = [...filteredNewData, ...existingData];
    
    // 按期号降序排序（最新的在前）
    mergedData.sort((a, b) => {
        const periodA = parseInt(a.period);
        const periodB = parseInt(b.period);
        return periodB - periodA;
    });
    
    return { mergedData, newCount: filteredNewData.length };
}

// 更新数据文件
function updateDataFiles(mergedData) {
    // 更新data.js文件
    const jsContent = `// 大乐透历史数据
// 自动更新于 ${new Date().toISOString()}

const lotteryData = ${JSON.stringify(mergedData, null, 2)};

// 导出数据（不同模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = lotteryData;
} else if (typeof window !== 'undefined') {
    window.lotteryData = lotteryData;
}
`;
    
    fs.writeFileSync(dataFile, jsContent, 'utf8');
    
    // 更新dlt_all.txt文件
    const rawLines = mergedData.map(item => item.rawData || `${item.period} ${item.date} ${item.frontNumbers.join(' ')} ${item.backNumbers.join(' ')}`);
    const rawContent = rawLines.join('\n');
    fs.writeFileSync(rawDataFile, rawContent, 'utf8');
    
    console.log(`成功更新数据文件，共 ${mergedData.length} 条记录`);
}

// 主函数
async function updateLotteryData() {
    try {
        console.log('开始更新大乐透数据...');
        
        // 1. 读取现有数据
        console.log('读取现有数据...');
        const existingData = readExistingData();
        console.log(`现有数据: ${existingData.length} 条记录`);
        
        // 2. 获取网络最新数据
        console.log('获取网络最新数据...');
        const apiData = await fetchLatestData();
        console.log(`从API获取到 ${apiData.length} 条记录`);
        
        // 3. 转换数据格式
        const newData = convertApiData(apiData);
        
        // 4. 合并数据
        console.log('合并新旧数据...');
        const { mergedData, newCount } = mergeData(existingData, newData);
        
        if (newCount > 0) {
            // 5. 更新文件
            updateDataFiles(mergedData);
            console.log(`数据更新完成，新增 ${newCount} 条记录`);
        } else {
            console.log('没有新数据需要更新');
        }
        
        return { success: true, newCount };
    } catch (error) {
        console.error('更新数据失败:', error.message);
        return { success: false, error: error.message };
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    updateLotteryData()
        .then(result => {
            if (result.success) {
                console.log('数据更新成功!');
            } else {
                console.error('数据更新失败:', result.error);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('发生未预期的错误:', error);
            process.exit(1);
        });
}

// 导出函数以供其他模块使用
module.exports = { updateLotteryData, fetchLatestData, convertApiData, mergeData };