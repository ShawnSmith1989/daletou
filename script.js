// 大乐透数据和分析脚本

// 号码属性配置
const numberProperties = {
    blue: { range: [1, 7], element: "水", color: "#3498db", label: "蓝色" },
    black: { range: [8, 14], element: "金", color: "#2c3e50", label: "黑色" },
    red: { range: [15, 21], element: "火", color: "#e74c3c", label: "红色" },
    yellow: { range: [22, 28], element: "土", color: "#f39c12", label: "黄色" },
    green: { range: [29, 35], element: "木", color: "#2ecc71", label: "绿色" }
};

// 质数列表（1-35）
const primeNumbers = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];

// 全局变量
let allData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 20;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化应用
function initializeApp() {
    // 加载本地数据
    loadLocalData();
    
    // 绑定事件
    bindEvents();
    
    // 显示初始数据
    displayData();
    
    // 更新统计信息
    updateStatistics();
}

// 加载本地数据
function loadLocalData() {
    // 使用从data.js加载的彩票数据
    if (typeof lotteryData !== 'undefined' && lotteryData.length > 0) {
        // 分析数据
        allData = lotteryData.map(item => {
            const analysis = analyzeNumbers(item.frontNumbers, item.backNumbers);
            return {
                ...item,
                ...analysis
            };
        });
        
        // 按日期倒序排列（最新的在前面）
        allData.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        filteredData = [...allData]; // 初始时，筛选数据等于全部数据
        
        // 设置默认日期范围
        const firstDate = new Date(allData[allData.length - 1].date);
        const lastDate = new Date(allData[0].date);
        
        document.getElementById('dateStart').value = formatDateForInput(firstDate);
        document.getElementById('dateEnd').value = formatDateForInput(lastDate);
        
        document.getElementById('periodStart').placeholder = `例如: ${allData[allData.length - 1].period}`;
        document.getElementById('periodEnd').placeholder = `例如: ${allData[0].period}`;
    } else {
        // 如果数据加载失败，显示错误信息
        showNotification('数据加载失败，请刷新页面重试', 'error');
    }
}

// 解析原始数据
function parseData(rawData) {
    const lines = rawData.trim().split('\n');
    const data = [];
    
    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 9) {
            const period = parts[0];
            const date = parts[1];
            const frontNumbers = parts.slice(2, 7).map(n => parseInt(n));
            const backNumbers = parts.slice(7, 9).map(n => parseInt(n));
            
            // 分析数据
            const analysis = analyzeNumbers(frontNumbers, backNumbers);
            
            data.push({
                period,
                date,
                frontNumbers,
                backNumbers,
                ...analysis
            });
        }
    }
    
    // 按日期倒序排列（最新的在前面）
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return data;
}

// 分析号码
function analyzeNumbers(frontNumbers, backNumbers) {
    // 奇偶比
    const oddEven = calculateOddEven(frontNumbers);
    
    // 质合比
    const primeComposite = calculatePrimeComposite(frontNumbers);
    
    // 号码属性分布
    const numberProperties = getNumberProperties(frontNumbers);
    
    // 和值
    const sum = frontNumbers.reduce((total, num) => total + num, 0);
    
    // 跨度
    const range = Math.max(...frontNumbers) - Math.min(...frontNumbers);
    
    return {
        oddEven,
        primeComposite,
        numberProperties,
        sum,
        range
    };
}

// 计算奇偶比
function calculateOddEven(numbers) {
    let oddCount = 0;
    let evenCount = 0;
    
    for (const num of numbers) {
        if (num % 2 === 0) {
            evenCount++;
        } else {
            oddCount++;
        }
    }
    
    return `${oddCount}:${evenCount}`;
}

// 计算质合比
function calculatePrimeComposite(numbers) {
    let primeCount = 0;
    let compositeCount = 0;
    
    for (const num of numbers) {
        if (primeNumbers.includes(num)) {
            primeCount++;
        } else {
            compositeCount++;
        }
    }
    
    return `${primeCount}:${compositeCount}`;
}

// 获取号码属性
function getNumberProperties(numbers) {
    const properties = {};
    
    for (const num of numbers) {
        for (const [color, config] of Object.entries(numberProperties)) {
            if (num >= config.range[0] && num <= config.range[1]) {
                if (!properties[color]) {
                    properties[color] = [];
                }
                properties[color].push(num);
                break;
            }
        }
    }
    
    return properties;
}

// 显示数据
function displayData() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    // 计算分页
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    const pageData = filteredData.slice(startIndex, endIndex);
    
    // 渲染数据
    for (const item of pageData) {
        const row = createTableRow(item);
        tableBody.appendChild(row);
    }
    
    // 更新分页
    updatePagination();
}

// 创建表格行
function createTableRow(data) {
    const row = document.createElement('tr');
    
    // 期号
    row.innerHTML = `<td>${data.period}</td>`;
    
    // 开奖日期
    row.innerHTML += `<td>${formatDate(data.date)}</td>`;
    
    // 前区号码
    const frontBalls = data.frontNumbers.map(num => 
        `<span class="ball red">${formatNumber(num)}</span>`
    ).join('');
    row.innerHTML += `<td>${frontBalls}</td>`;
    
    // 后区号码
    const backBalls = data.backNumbers.map(num => 
        `<span class="ball blue">${formatNumber(num)}</span>`
    ).join('');
    row.innerHTML += `<td>${backBalls}</td>`;
    
    // 号码属性
    const propertyBalls = [];
    for (const [color, numbers] of Object.entries(data.numberProperties)) {
        const config = numberProperties[color];
        propertyBalls.push(
            `<span class="badge color-${color} me-1">${config.label} (${numbers.length})</span>`
        );
    }
    row.innerHTML += `<td>${propertyBalls.join('')}</td>`;
    
    // 奇偶比
    row.innerHTML += `<td>${data.oddEven}</td>`;
    
    // 质合比
    row.innerHTML += `<td>${data.primeComposite}</td>`;
    
    // 和值
    row.innerHTML += `<td>${data.sum}</td>`;
    
    // 跨度
    row.innerHTML += `<td>${data.range}</td>`;
    
    return row;
}

// 格式化号码
function formatNumber(num) {
    return num < 10 ? `0${num}` : num.toString();
}

// 格式化日期
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

// 格式化日期用于输入框
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 更新分页
function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    // 上一页
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous">
        <span aria-hidden="true">&laquo;</span>
    </a>`;
    prevLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            displayData();
        }
    });
    pagination.appendChild(prevLi);
    
    // 页码
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            displayData();
        });
        pagination.appendChild(li);
    }
    
    // 下一页
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next">
        <span aria-hidden="true">&raquo;</span>
    </a>`;
    nextLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            displayData();
        }
    });
    pagination.appendChild(nextLi);
}

// 更新统计信息
function updateStatistics() {
    // 总期数
    document.getElementById('totalPeriods').textContent = filteredData.length;
    
    if (filteredData.length === 0) {
        document.getElementById('oddEvenRatio').textContent = '0:0';
        document.getElementById('primeCompositeRatio').textContent = '0:0';
        document.getElementById('colorDistribution').textContent = '--';
        return;
    }
    
    // 计算奇偶比
    let totalOdd = 0;
    let totalEven = 0;
    
    // 计算质合比
    let totalPrime = 0;
    let totalComposite = 0;
    
    // 计算颜色分布
    const colorCounts = {};
    for (const color of Object.keys(numberProperties)) {
        colorCounts[color] = 0;
    }
    
    for (const item of filteredData) {
        // 处理奇偶比
        const [odd, even] = item.oddEven.split(':').map(n => parseInt(n));
        totalOdd += odd;
        totalEven += even;
        
        // 处理质合比
        const [prime, composite] = item.primeComposite.split(':').map(n => parseInt(n));
        totalPrime += prime;
        totalComposite += composite;
        
        // 处理颜色分布
        for (const color of Object.keys(item.numberProperties)) {
            colorCounts[color] += item.numberProperties[color].length;
        }
    }
    
    // 更新统计信息
    document.getElementById('oddEvenRatio').textContent = `${totalOdd}:${totalEven}`;
    document.getElementById('primeCompositeRatio').textContent = `${totalPrime}:${totalComposite}`;
    
    // 找出最多的颜色
    let maxColor = '';
    let maxCount = 0;
    for (const [color, count] of Object.entries(colorCounts)) {
        if (count > maxCount) {
            maxColor = numberProperties[color].label;
            maxCount = count;
        }
    }
    
    document.getElementById('colorDistribution').textContent = maxColor;
}

// 筛选数据
function filterData() {
    const periodStart = document.getElementById('periodStart').value.trim();
    const periodEnd = document.getElementById('periodEnd').value.trim();
    const dateStart = document.getElementById('dateStart').value;
    const dateEnd = document.getElementById('dateEnd').value;
    
    // 重置筛选数据
    filteredData = [...allData];
    
    // 按期号筛选
    if (periodStart) {
        filteredData = filteredData.filter(item => parseInt(item.period) >= parseInt(periodStart));
    }
    
    if (periodEnd) {
        filteredData = filteredData.filter(item => parseInt(item.period) <= parseInt(periodEnd));
    }
    
    // 按日期筛选
    if (dateStart) {
        filteredData = filteredData.filter(item => new Date(item.date) >= new Date(dateStart));
    }
    
    if (dateEnd) {
        filteredData = filteredData.filter(item => new Date(item.date) <= new Date(dateEnd));
    }
    
    // 重置分页
    currentPage = 1;
    
    // 显示筛选后的数据
    displayData();
    updateStatistics();
    
    // 如果筛选结果为空，显示提示
    if (filteredData.length === 0) {
        showNotification('没有符合条件的数据，请调整筛选条件', 'info');
    } else {
        showNotification(`筛选完成，共找到 ${filteredData.length} 条数据`, 'success');
    }
}

// 重置筛选
function resetFilter() {
    document.getElementById('periodStart').value = '';
    document.getElementById('periodEnd').value = '';
    
    // 重置日期范围
    if (allData.length > 0) {
        const firstDate = new Date(allData[allData.length - 1].date);
        const lastDate = new Date(allData[0].date);
        
        document.getElementById('dateStart').value = formatDateForInput(firstDate);
        document.getElementById('dateEnd').value = formatDateForInput(lastDate);
    }
    
    // 重置筛选数据
    filteredData = [...allData];
    currentPage = 1;
    
    // 显示所有数据
    displayData();
    updateStatistics();
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知容器（如果不存在）
    let notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.className = 'position-fixed top-0 end-0 p-3';
        notificationContainer.style.zIndex = '1050';
        document.body.appendChild(notificationContainer);
    }
    
    // 创建通知元素
    const notificationId = 'notification-' + Date.now();
    const notification = document.createElement('div');
    notification.id = notificationId;
    notification.className = `toast show align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} border-0`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    notification.setAttribute('aria-atomic', 'true');
    
    notification.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // 添加到容器
    notificationContainer.appendChild(notification);
    
    // 绑定关闭事件
    notification.querySelector('button').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 300);
    });
    
    // 自动关闭
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notificationContainer.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// 导出数据
function exportData() {
    if (filteredData.length === 0) {
        showNotification('没有可导出的数据', 'error');
        return;
    }
    
    let csv = '期号,开奖日期,前区号码,后区号码,号码属性,奇偶比,质合比,和值,跨度\n';
    
    for (const item of filteredData) {
        const frontNumbers = item.frontNumbers.join(' ');
        const backNumbers = item.backNumbers.join(' ');
        
        // 构建号码属性字符串
        let properties = '';
        for (const [color, numbers] of Object.entries(item.numberProperties)) {
            properties += `${numberProperties[color].label}(${numbers.join(',')});`;
        }
        
        csv += `${item.period},${item.date},${frontNumbers},${backNumbers},${properties},${item.oddEven},${item.primeComposite},${item.sum},${item.range}\n`;
    }
    
    // 创建下载链接
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `大乐透数据_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('数据导出成功', 'success');
}

// 显示更新数据模态框
function showUpdateModal() {
    const modal = new bootstrap.Modal(document.getElementById('updateModal'));
    document.getElementById('updateStatus').textContent = '准备更新最新开奖数据...';
    document.getElementById('updateProgressContainer').style.display = 'none';
    document.getElementById('updateResult').innerHTML = '';
    document.getElementById('confirmUpdate').disabled = false;
    modal.show();
}

// 更新大乐透数据
async function updateLotteryData() {
    // 禁用更新按钮，防止重复点击
    document.getElementById('confirmUpdate').disabled = true;
    document.getElementById('updateStatus').textContent = '正在获取最新开奖数据...';
    document.getElementById('updateProgressContainer').style.display = 'block';
    
    // 显示进度条
    let progress = 0;
    const progressBar = document.getElementById('updateProgress');
    const progressInterval = setInterval(() => {
        progress = Math.min(progress + 5, 90); // 最多到90%，等待实际结果
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
    }, 200);
    
    try {
        // 尝试获取最新数据
        let apiResponse;
        let response;
        
        // 尝试使用官方API
        try {
            response = await fetch('https://webapi.sporttery.cn/gateway/lottery/getHistoryPageListV1.qry?gameNo=85&provinceId=0&pageSize=30&isVerify=1&pageNo=1');
            
            if (response.ok) {
                apiResponse = await response.json();
                
                // 检查API返回数据结构
                if (apiResponse.success) {
                    if (apiResponse.data && apiResponse.data.list) {
                        // 旧版API格式
                    } else if (apiResponse.value && apiResponse.value.drawResult) {
                        // 新版API格式
                        apiResponse.data = { list: apiResponse.value.drawResult || [] };
                    } else if (apiResponse.value && apiResponse.value.lotteryDrawResult) {
                        // 最新API格式
                        apiResponse.data = { list: [apiResponse.value] };
                    } else {
                        throw new Error('API返回数据格式不正确');
                    }
                }
            } else {
                throw new Error('官方API请求失败');
            }
        } catch (error) {
            // 如果官方API失败，尝试使用备用API
            console.warn('官方API请求失败，尝试使用备用API:', error.message);
            
            try {
                response = await fetch('https://api.apiopen.top/api/getlottery?type=dlt&limit=30');
                if (response.ok) {
                    const backupApiResponse = await response.json();
                    if (backupApiResponse.code === 200 && backupApiResponse.data && backupApiResponse.data.length > 0) {
                        // 转换数据格式以匹配官方API结构
                        apiResponse = {
                            success: true,
                            data: {
                                list: backupApiResponse.data.map(item => {
                                    // 解析日期 "2025-01-01" 格式
                                    const dateParts = item.expect.split('-');
                                    const lotteryDrawNum = dateParts[0] + dateParts[1].padStart(3, '0');
                                    const lotteryDrawTime = dateParts.join('-');
                                    const numbers = item.openCode.split('+');
                                    const frontNumbers = numbers[0].split(' ');
                                    const backNumbers = numbers[1] ? numbers[1].split(' ') : ['01', '02'];
                                    
                                    return {
                                        lotteryDrawNum,
                                        lotteryDrawTime,
                                        lotteryDrawResult: [...frontNumbers, ...backNumbers].join(' ')
                                    };
                                })
                            }
                        };
                    } else {
                        throw new Error('备用API返回数据格式不正确');
                    }
                } else {
                    throw new Error('备用API请求失败');
                }
            } catch (backupError) {
                console.warn('备用API也失败了:', backupError.message);
                throw new Error('无法从任何数据源获取最新数据。可能是因为浏览器安全限制或API服务不可用。请尝试使用Node.js脚本更新数据: node update_data.js');
            }
        }
        
        // 转换数据格式
        const newLotteryData = apiResponse.data.list.map(item => {
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
        
        // 合并数据
        const existingPeriods = new Set(allData.map(item => item.period));
        const filteredNewData = newLotteryData.filter(item => !existingPeriods.has(item.period));
        
        // 停止进度条动画
        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        progressBar.textContent = '100%';
        progressBar.setAttribute('aria-valuenow', 100);
        
        // 显示更新结果
        const updateResult = document.getElementById('updateResult');
        
        if (filteredNewData.length > 0) {
            // 合并数据（新数据在前）
            allData = [...filteredNewData, ...allData];
            
            // 按期号降序排序（最新的在前）
            allData.sort((a, b) => {
                const periodA = parseInt(a.period);
                const periodB = parseInt(b.period);
                return periodB - periodA;
            });
            
            // 重置筛选数据
            filteredData = [...allData];
            
            // 重新显示数据
            currentPage = 1;
            displayData();
            updateStatistics();
            
            // 更新最新期号和日期提示
            const latestData = allData[0];
            document.getElementById('dateEnd').value = formatDateForInput(new Date(latestData.date));
            document.getElementById('periodEnd').placeholder = `例如: ${latestData.period}`;
            
            updateResult.innerHTML = `
                <div class="alert alert-success">
                    <h6><i class="bi bi-check-circle-fill"></i> 数据更新成功</h6>
                    <p class="mb-0">成功获取 <strong>${filteredNewData.length}</strong> 条新开奖数据</p>
                    <p class="mb-0">最新期号: <strong>${latestData.period}</strong> (${latestData.date})</p>
                </div>
            `;
            
            showNotification(`数据更新成功，新增 ${filteredNewData.length} 条开奖记录`, 'success');
        } else {
            updateResult.innerHTML = `
                <div class="alert alert-info">
                    <h6><i class="bi bi-info-circle-fill"></i> 没有新数据</h6>
                    <p class="mb-0">当前数据已是最新，无需更新</p>
                </div>
            `;
            
            showNotification('当前数据已是最新，无需更新', 'info');
        }
        
        // 3秒后自动关闭模态框
        setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('updateModal'));
            if (modal) modal.hide();
        }, 3000);
        
    } catch (error) {
        // 停止进度条动画
        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        progressBar.textContent = '100%';
        progressBar.setAttribute('aria-valuenow', 100);
        
        // 显示错误信息
        document.getElementById('updateResult').innerHTML = `
            <div class="alert alert-danger">
                <h6><i class="bi bi-exclamation-triangle-fill"></i> 更新失败</h6>
                <p class="mb-0">${error.message}</p>
                <p class="mb-0">请检查网络连接或稍后重试</p>
            </div>
        `;
        
        showNotification(`更新数据失败: ${error.message}`, 'error');
        
        // 重新启用更新按钮
        document.getElementById('confirmUpdate').disabled = false;
    }
}

// 绑定事件
function bindEvents() {
    document.getElementById('filterButton').addEventListener('click', filterData);
    document.getElementById('resetFilter').addEventListener('click', resetFilter);
    document.getElementById('exportData').addEventListener('click', exportData);
    document.getElementById('updateData').addEventListener('click', showUpdateModal);
    document.getElementById('confirmUpdate').addEventListener('click', updateLotteryData);
    
    // 期号输入框回车事件
    document.getElementById('periodStart').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            filterData();
        }
    });
    
    document.getElementById('periodEnd').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            filterData();
        }
    });
}