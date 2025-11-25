// 大乐透区间分布图脚本

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
let distributionChart = null;
let currentPage = 1;
const itemsPerPage = 20;

// 初始化图表
function initializeChart() {
    // 加载数据
    loadData();
    
    // 绑定事件
    bindEvents();
    
    // 初始渲染图表
    updateChart();
    
    // 初始渲染表格
    displayDataTable();
}

// 加载数据
function loadData() {
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
        
        // 初始时，筛选数据等于全部数据
        filteredData = [...allData];
    } else {
        // 如果数据加载失败，显示错误信息
        showNotification('数据加载失败，请刷新页面重试', 'error');
    }
}

// 分析号码
function analyzeNumbers(frontNumbers, backNumbers) {
    // 奇偶比
    const oddEven = calculateOddEven(frontNumbers);
    
    // 质合比
    const primeComposite = calculatePrimeComposite(frontNumbers);
    
    // 号码属性分布（用于表格显示）
    const numberPropertiesDetail = getNumberPropertiesDetail(frontNumbers);
    
    // 号码属性分布（用于图表显示）
    const numberProperties = getNumberProperties(frontNumbers);
    
    // 和值
    const sum = frontNumbers.reduce((total, num) => total + num, 0);
    
    // 跨度
    const range = Math.max(...frontNumbers) - Math.min(...frontNumbers);
    
    return {
        oddEven,
        primeComposite,
        numberProperties,
        numberPropertiesDetail,
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

// 获取号码属性（用于表格显示）
function getNumberPropertiesDetail(numbers) {
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

// 获取号码属性（用于图表显示）
function getNumberProperties(numbers) {
    const properties = {};
    
    // 初始化所有属性为0
    for (const color of Object.keys(numberProperties)) {
        properties[color] = 0;
    }
    
    // 确保numbers是数组
    if (!Array.isArray(numbers)) {
        return properties;
    }
    
    for (const num of numbers) {
        // 确保num是数字
        const numValue = typeof num === 'string' ? parseInt(num) : num;
        if (isNaN(numValue)) continue;
        
        for (const [color, config] of Object.entries(numberProperties)) {
            if (numValue >= config.range[0] && numValue <= config.range[1]) {
                properties[color]++;
                break;
            }
        }
    }
    
    return properties;
}

// 准备图表数据
function prepareChartData() {
    const chartData = {
        labels: [],
        datasets: []
    };
    
    // 准备标签（期号）
    for (const item of filteredData) {
        chartData.labels.push(item.period);
    }
    
    // 准备各区间数据集
    for (const [color, config] of Object.entries(numberProperties)) {
        const dataset = {
            label: `${config.label}(${config.range[0]}-${config.range[1]})`,
            data: [],
            backgroundColor: config.color,
            borderColor: config.color,
            borderWidth: 2
        };
        
        // 收集该区间的数据
        for (const item of filteredData) {
            const properties = getNumberProperties(item.frontNumbers);
            dataset.data.push(properties[color]);
        }
        
        chartData.datasets.push(dataset);
    }
    
    return chartData;
}

// 更新图表
function updateChart() {
    const periodCount = parseInt(document.getElementById('periodCount').value);
    
    // 筛选数据
    if (periodCount === 0) {
        filteredData = [...allData];
    } else {
        filteredData = allData.slice(0, Math.min(periodCount, allData.length));
    }
    
    // 准备图表数据
    const chartData = prepareChartData();
    
    // 折线图配置
    const chartConfig = {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '期号'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 5, // 最大值为5，因为每期前区开出5个号码，每个属性区间最多出现5个号码
                    title: {
                        display: true,
                        text: '号码属性对应个数'
                    },
                    ticks: {
                        precision: 0, // 不显示小数
                        callback: function(value) {
                            return value + '个';
                        },
                        font: {
                            size: 12
                        },
                        // 明确设置刻度值，只显示0、1、2、3、4、5
                        values: [0, 1, 2, 3, 4, 5],
                        stepSize: 1
                    },
                    grid: {
                        display: true,
                        drawBorder: false
                    }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label.split('(')[0]; // 获取属性名称（去掉号码范围）
                            // 获取原始数据索引，从原始数据中获取真实值
                            const dataIndex = context.dataIndex;
                            const originalValue = filteredData[dataIndex] ? 
                                getNumberProperties(filteredData[dataIndex].frontNumbers)[Object.keys(numberProperties)[context.datasetIndex]] : 
                                0;
                            return `${label}属性: ${originalValue}个号码`;
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    };
    
    // 折线图样式设置
    chartConfig.data.datasets.forEach((dataset, index) => {
        dataset.fill = false; // 不填充
        dataset.tension = 0.1; // 添加轻微曲线
        dataset.borderWidth = 2; // 线条宽度
        dataset.pointRadius = 4; // 点的大小
        dataset.pointHoverRadius = 6; // 悬停时点的大小
        
        // 为不同属性的点添加轻微的垂直偏移，避免重叠
        // 每个点向上下偏移一点点，使它们可以区分开
        const offsets = [0.1, -0.1, 0.2, -0.2, 0.15]; // 每个属性的垂直偏移
        
        // 处理数据点，添加偏移
        dataset.data = dataset.data.map(value => {
            // 只有当值大于0时才添加偏移，避免影响0值的显示
            return value > 0 ? value + offsets[index] : value;
        });
        
        // 根据不同属性设置不同的点样式和大小
        dataset.pointStyle = 'circle'; // 圆形点
        
        // 为不同属性设置不同的点的大小
        switch(index) {
            case 0: // 蓝色
                dataset.pointRadius = 4.5;
                dataset.pointHoverRadius = 6.5;
                dataset.pointBackgroundColor = '#3498db'; // 蓝色
                dataset.pointBorderColor = 'white'; // 白色边框
                dataset.pointBorderWidth = 1.5;
                break;
            case 1: // 黑色
                dataset.pointRadius = 3.5;
                dataset.pointHoverRadius = 5.5;
                dataset.pointBackgroundColor = '#2c3e50'; // 黑色
                dataset.pointBorderColor = 'white'; // 白色边框
                dataset.pointBorderWidth = 1.5;
                break;
            case 2: // 红色
                dataset.pointRadius = 5;
                dataset.pointHoverRadius = 7;
                dataset.pointBackgroundColor = '#e74c3c'; // 红色
                dataset.pointBorderColor = 'white'; // 白色边框
                dataset.pointBorderWidth = 1.5;
                break;
            case 3: // 黄色
                dataset.pointRadius = 3;
                dataset.pointHoverRadius = 5;
                dataset.pointBackgroundColor = '#f39c12'; // 黄色
                dataset.pointBorderColor = 'white'; // 白色边框
                dataset.pointBorderWidth = 1.5;
                break;
            case 4: // 绿色
                dataset.pointRadius = 4;
                dataset.pointHoverRadius = 6;
                dataset.pointBackgroundColor = '#2ecc71'; // 绿色
                dataset.pointBorderColor = 'white'; // 白色边框
                dataset.pointBorderWidth = 1.5;
                break;
        }
    });
    
    // 创建或更新图表
    const ctx = document.getElementById('distributionChart').getContext('2d');
    
    if (distributionChart) {
        distributionChart.destroy();
    }
    
    distributionChart = new Chart(ctx, chartConfig);
    
    // 更新统计信息
    updateStatistics();
    
    // 显示数据表格
    displayDataTable();
}

// 更新统计信息
function updateStatistics() {
    // 分析期数
    document.getElementById('totalPeriods').textContent = filteredData.length;
    
    if (filteredData.length === 0) {
        document.getElementById('blueAvg').textContent = '0';
        document.getElementById('redAvg').textContent = '0';
        document.getElementById('greenAvg').textContent = '0';
        return;
    }
    
    // 计算各区间平均值
    const colorCounts = {};
    for (const color of Object.keys(numberProperties)) {
        colorCounts[color] = 0;
    }
    
    for (const item of filteredData) {
        const properties = getNumberProperties(item.frontNumbers);
        for (const color of Object.keys(properties)) {
            colorCounts[color] += properties[color];
        }
    }
    
    // 更新平均值
    for (const color of Object.keys(colorCounts)) {
        const avg = (colorCounts[color] / filteredData.length).toFixed(1);
        if (document.getElementById(`${color}Avg`)) {
            document.getElementById(`${color}Avg`).textContent = avg;
        }
    }
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

// 导出图表
function exportChart() {
    if (!distributionChart) {
        showNotification('请先生成图表', 'error');
        return;
    }
    
    // 创建一个临时链接来下载图表
    const link = document.createElement('a');
    link.download = `大乐透区间分布图_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = distributionChart.toBase64Image();
    link.click();
    
    showNotification('图表导出成功', 'success');
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
            
            // 更新图表和统计
            updateChart();
            updateStatistics();
            displayDataTable();
            
            // 显示更新结果
            const latestData = allData[0];
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

// 显示数据表格
function displayDataTable() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
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
    if (data.numberPropertiesDetail) {
        for (const [color, numbers] of Object.entries(data.numberPropertiesDetail)) {
            const config = numberProperties[color];
            propertyBalls.push(
                `<span class="badge me-1" style="background-color: ${config.color}">${config.label} (${numbers.length})</span>`
            );
        }
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

// 更新分页
function updatePagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
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
            displayDataTable();
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
            displayDataTable();
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
            displayDataTable();
        }
    });
    pagination.appendChild(nextLi);
}

// 绑定事件
function bindEvents() {
    document.getElementById('updateButton').addEventListener('click', updateChart);
    document.getElementById('updateData').addEventListener('click', showUpdateModal);
    document.getElementById('confirmUpdate').addEventListener('click', updateLotteryData);
    
    // 添加导出图表按钮
    const updateButton = document.getElementById('updateButton');
    const exportButton = document.createElement('button');
    exportButton.className = 'btn btn-success ms-2';
    exportButton.innerHTML = '<i class="bi bi-download"></i> 导出图表';
    exportButton.addEventListener('click', exportChart);
    updateButton.parentNode.appendChild(exportButton);
}