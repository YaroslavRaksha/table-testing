const url = "https://api.jsonbin.io/v3/b";
let binId = "";

let bot = {
    token: "",
    id: "",
    dollarValue: null,
    totalSend: false,
}

let masterKey = "";

const buyDollarTable = document.getElementById('buy-dollar');
const saleDollarTable = document.getElementById('sale-dollar');
const buyEuroTable = document.getElementById('buy-euro');
const saleEuroTable = document.getElementById('sale-euro');

let apiData = null;
let now = new Date();
let day = ("0" + now.getDate()).slice(-2);
let month = ("0" + (now.getMonth() + 1)).slice(-2);
let selectedDay = now.getFullYear()+"-"+(month)+"-"+(day);

function error(string) {
    return alert(string);
}

function setLoading(value) {
    return document.getElementById('loading').style.display = `${value ? "flex" : "none"}`;
}

async function setNewData(newData, storageId) {
    return fetch(url + `/${storageId ? storageId : binId }`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': masterKey,
        },
        body: JSON.stringify(storageId ? {...newData} : {"data": {...newData}})
    }).then((response) => response.json());
}

async function getBotData (pass) {
    return await fetch(url + '/62adc661449a1f38210eb394/latest', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': pass,
        }
    }).then((response) => response.json());
}


async function setBotData (data) {
    return await fetch(url + '/62adc661449a1f38210eb394', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': masterKey,
        },
        body: JSON.stringify(data),
    }).then((response) => response.json());
}

async function callbackExistence(data) {
    setExistence(data, 'dollar');
    setExistence(data, 'euro');
    setExistence(data, 'hryvnia');
}

function changeTab(isDollar) {
    const dollarTable = document.getElementById('dollar');
    const euroTable = document.getElementById('euro');
    const toggleDollar = document.getElementById('toggle-dollar');
    const toggleEuro = document.getElementById('toggle-euro');
    if(isDollar) {
        if(toggleDollar.classList.contains('selected')) {
            return false;
        }
        else {
            toggleDollar.classList.add('selected');
            toggleEuro.classList.remove('selected')
            dollarTable.classList.remove('hidden-table');
            euroTable.classList.add('hidden-table');
        }
    }
    if(!isDollar) {
        if(toggleEuro.classList.contains('selected')) {
            return false;
        }
        else {
            toggleEuro.classList.add('selected');
            toggleDollar.classList.remove('selected');
            euroTable.classList.remove('hidden-table');
            dollarTable.classList.add('hidden-table');
        }
    }
}

function noData() {
    buyDollarTable.innerHTML = null;
    buyEuroTable.innerHTML = null;
    saleDollarTable.innerHTML = null;
    saleEuroTable.innerHTML = null;
    document.querySelectorAll('.total .col').forEach((el) => {
        el.innerHTML = ""
    });
    let arr = ['dollar', 'euro', 'hryvnia'];
    arr.map((el) => {
        document.querySelector(`#existing-current .${el}`).innerHTML = "";
        document.querySelector(`#existing-morning .${el}`).innerHTML = "";
    });
}


function changeRow (id, key, type) {
    setLoading(true);
    let activeChangeRow = document.querySelector('.change-row-active');
    if(activeChangeRow) {
        const type = activeChangeRow.getAttribute('data-type');
        const id = activeChangeRow.getAttribute('data-id');
        const value = activeChangeRow.value;
        setRowData(value, parseInt(id), key, type, true);
        activeChangeRow.classList.remove('change-row-active');
    }

    const input = document.querySelector(`div[data-row-id="${id}"] #change-${type}`);

    input.classList.add('change-row-active');
    input.setAttribute('data-type', type);
    input.setAttribute('data-id', id);

    const currentValue = document.querySelector(`div[data-row-id="${id}"] #${type}`);
    const button = document.querySelector(`div[data-row-id="${id}"] .change-${type}-btn`);
    button.style.display = "none";
    currentValue.style.display = "none";
    input.style.display = "block";
    input.value = currentValue.innerHTML;
    setLoading(false);
    return false;
}

function rowChanged(id, type, newValue) {
    const input = document.querySelector(`div[data-row-id="${id}"] #change-${type}`);
    const currentValue = document.querySelector(`div[data-row-id="${id}"] #${type}`);
    const button = document.querySelector(`div[data-row-id="${id}"] .change-${type}-btn`);

    button.style.display = null;
    currentValue.style.display = null;
    currentValue.innerHTML = newValue;
    input.style.display = null;

    const sum = document.querySelector(`div[data-row-id="${id}"] #sum`);
    const amount = document.querySelector(`div[data-row-id="${id}"] #amount`).innerHTML;
    const course = document.querySelector(`div[data-row-id="${id}"] #course`).innerHTML;

    sum.innerHTML = `${(parseFloat(amount) * parseFloat(course)).toFixed(2)}`
    return false;
}

async function setRowData(e, id, key, type, outsider) {
    const newValue = outsider ? e : e.target.value;
    const charCode = (e.which) ? e.which : e.keyCode;
    if(charCode === 13 || outsider) {
        let value = apiData[selectedDay][key].find((obj) => obj.id === id)[type];

        if(value && parseFloat(newValue) !== value) {
            apiData[selectedDay][key].find((obj) => obj.id === id)[type] = parseFloat(newValue)
            const newData = {...apiData};
            const response = await setNewData(newData);
            setLoading(true);
            if(!response?.message) {
                await callbackExistence({...apiData}[selectedDay])
                setTotalChanges({...apiData}[selectedDay]);
                rowChanged(id, type, newValue);
                setLoading(false);
                return false;
            }
            else {
                alert('Ошибка при изменении');
                return false;
            }
        }
        if(parseFloat(newValue) === value) {
            rowChanged(id, type, parseFloat(newValue))
        }
        if(isNaN(parseFloat(newValue))) {
            error('Поле не может быть пустым');
            return false;
        }
    }
}

function createRow(key, obj) {
    return `<div class="row" data-row-id="${obj["id"]}">
                <div data-type="amount" class="col">
                    <span id="amount">${obj["amount"]}</span>
                    <input class="change-input" onkeypress="setRowData(event, ${obj["id"]}, '${key}', 'amount', false)" id="change-amount" type="number" step="0.0001" />
                    <button onclick="changeRow(${obj["id"]}, '${key}', 'amount')" class="change-amount-btn ${selectedDay === now.getFullYear()+"-"+(month)+"-"+(day) ? 'visible' : ''}">изменить</button>
                </div>
                <div data-type="course" class="col">
                    <span id="course">${obj["course"]}</span>
                    <input class="change-input" onkeypress="setRowData(event, ${obj["id"]}, '${key}', 'course', false)" id="change-course" type="number" step="0.0001" />
                    <button onclick="changeRow(${obj["id"]}, '${key}', 'course')" class="change-course-btn ${selectedDay === now.getFullYear()+"-"+(month)+"-"+(day) ? 'visible' : ''}">изменить</button>
                </div>
                <div class="col">
                    <span id="sum" data-type="sum">${(obj["amount"] * obj["course"]).toFixed(2)}</span>
                    <span class="additional-block ${selectedDay === now.getFullYear()+"-"+(month)+"-"+(day) ? 'visible' : ''}">
                        <span class="time">${obj["time"]}</span>
                        <button onclick="deleteRow(${obj["id"]}, '${key}')" class="delete-row">удалить ряд</button>
                    </span>
                </div>
            </div>`
}

async function addRow(isBuy, isDollar) {
    const currency = isDollar ? 'dollar' : 'euro';
    const type = isBuy ? 'buy' : 'sale';
    const inputSum = document.querySelector(`#${currency} .${type} input[data-input="sum"]`);
    const inputCourse = document.querySelector(`#${currency} .${type} input[data-input="course"]`);
    const now = new Date();


    if(!isNaN(parseFloat(inputSum.value)) && !isNaN(parseFloat(inputCourse.value))) {
        let obj = {
            "id": Date.now(),
            "amount": parseFloat(inputSum.value),
            "course": parseFloat(inputCourse.value),
            "time": now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes(),
        }
        const response = await putData(type, currency, obj);
        if(!response?.message) {
            const row = createRow(`${type}-${currency}`,obj);
            const table = document.getElementById(`${type}-${currency}`);
            table.innerHTML = table.innerHTML + row;
            inputSum.value = null;
            inputCourse.value = null;
        }
        else {
            error('Ошибка при PUT');
        }
    }
}

async function sendTelegramMessage(text) {
    const response = await fetch(`https://api.telegram.org/bot${bot.token}/sendMessage?chat_id=${bot.id}&text=${text}`);
    const data = await response.json()
    return data;
}

async function checkForTelegramTotal() {

    let dollarBuy = document.querySelector('#dollar .buy div[data-total="course"]').innerHTML;
    let dollarSale = document.querySelector('#dollar .sale div[data-total="course"]').innerHTML
    let dollarTotalBuy = document.querySelector('#dollar .buy div[data-total="amount"]').innerHTML

    let euroBuy = document.querySelector('#euro .buy div[data-total="course"]').innerHTML;
    let euroSale = document.querySelector('#euro .sale div[data-total="course"]').innerHTML;
    let euroTotalBuy = document.querySelector('#euro .buy div[data-total="amount"]').innerHTML;

    dollarBuy = dollarBuy ? parseFloat(dollarBuy).toFixed(2) : 0;
    dollarSale = dollarSale ? parseFloat(dollarSale).toFixed(2) : 0;
    dollarTotalBuy = dollarTotalBuy ? parseFloat(dollarTotalBuy).toFixed(2) : 0;
    euroBuy = euroBuy ? parseFloat(euroBuy).toFixed(2) : 0;
    euroSale = euroSale ? parseFloat(euroSale).toFixed(2) : 0;
    euroTotalBuy = euroTotalBuy ? parseFloat(euroTotalBuy).toFixed(2) : 0;

    let output = (((dollarSale - dollarBuy) * dollarTotalBuy) + ((euroSale - euroBuy) * euroTotalBuy) - 1600).toFixed(2);
    bot.totalSend = true;

    const message = await sendTelegramMessage("Выручка: " + output);
    if(message.ok) {
        const response = await setBotData(bot);
        if(response.message) {
            return false;
        }
        else {
            return true;
        }
    }
    else {
        return false;
    }

}

function generateTotal(type, currency, arr) {
    let totalAmount = null;
    let averageCourse = null;
    let totalSum = null
    arr.map((obj) => {
        totalAmount += obj["amount"];
        averageCourse += obj["course"];
        totalSum += obj["amount"] * obj["course"];
    });
    averageCourse = (averageCourse / arr.length).toFixed(4);

    document.querySelector(`#${currency} .${type} div[data-total="amount"]`).innerHTML = `${parseFloat(totalAmount).toFixed(2)}`;
    document.querySelector(`#${currency} .${type} div[data-total="course"]`).innerHTML = `${averageCourse}`;
    document.querySelector(`#${currency} .${type} div[data-total="sum"]`).innerHTML = `${parseFloat(totalSum).toFixed(2)}`;
}

async function checkForTelegramDollarValue(value) {

    if(bot.dollarValue !== 3 && value > 10000) {
        bot.dollarValue = 3;
        const response = await setBotData(bot);
        if (!response.message) {
            const message = await sendTelegramMessage("Доллар+больше+10000");
            if (!message.ok) {
                console.log('Error in telegram message')
            }
        }
    }
    if(bot.dollarValue !== 2 && value > 5000 && value < 10000) {
        bot.dollarValue = 2;
        const response = await setBotData(bot);
        if (!response.message) {
            const message = await sendTelegramMessage("Доллар+меньше+10000");
            if (!message.ok) {
                console.log('Error in telegram message')
            }
        }
    }
    if(bot.dollarValue !== 1 && value > 2000 && value < 5000) {
        bot.dollarValue = 1;
        const response = await setBotData(bot);
        if (!response.message) {
            const message = await sendTelegramMessage("Доллар+меньше+5000");
            if (!message.ok) {
                console.log('Error in telegram message')
            }
        }
    }
    if(bot.dollarValue !== 0 && value < 2000) {
        bot.dollarValue = 0;
        const response = await setBotData(bot);
        if (!response.message) {
            const message = await sendTelegramMessage("Доллар+меньше+2000");
            if (!message.ok) {
                console.log('Error in telegram message')
            }
        }
    }
    else {
        return false;
    }
}

function setTotalChanges(obj) {
    document.querySelectorAll('div[data-total]').forEach((dom) => dom.innerHTML = "");
    if(obj && obj["buy-dollar"]?.length > 0) {
        generateTotal('buy', 'dollar', obj["buy-dollar"]);
    }
    if(obj && obj["sale-dollar"]?.length > 0) {
        generateTotal('sale', 'dollar', obj["sale-dollar"]);
    }
    if(obj && obj["buy-euro"]?.length > 0) {
        generateTotal('buy', 'euro', obj["buy-euro"]);
    }
    if(obj && obj["sale-euro"]?.length > 0) {
        generateTotal('sale', 'euro', obj["sale-euro"]);
    }

    setTimeout(() => {
        if(selectedDay === now.getFullYear()+"-"+(month)+"-"+(day)) {
            const dollar = document.querySelector('#existing-current .dollar').innerHTML;
            if(dollar) {
                const dollarCheck = checkForTelegramDollarValue(parseInt(dollar));
                if(!dollarCheck) {
                    console.log('Error in sending telegram message')
                }
            }
            if(now.getHours() >= 18 && !bot.totalSend) {
                const check = checkForTelegramTotal();
                if(!check) {
                    console.log('Error in sending telegram message')
                }
            }
            if(now.getHours() < 18 && bot.totalSend) {
                bot.totalSend = false;
                const response = setBotData(bot);
                if(!response.message) {
                    bot.totalSend = true;
                }
                if(response.message) {
                    console.log('Error in sending telegram message')
                }
            }
        }
    }, 0)
}

function handleAddRow() {
    const addRowDom = document.querySelectorAll('.add-row');
    if(selectedDay === now.getFullYear()+"-"+(month)+"-"+(day)) {
        addRowDom.forEach((dom) => {
            dom.style.display = 'flex';
        })
    }
    else {
        addRowDom.forEach((dom) => {
            dom.style.display = 'none';
        })
    }
}

async function deleteRow(id, key) {
    if(!(selectedDay === now.getFullYear()+"-"+(month)+"-"+(day))) {
        return false;
    }
    const newData = apiData;
    newData[selectedDay][key].find((obj, index) => {
        if(obj.id === id) {
            delete apiData[selectedDay][key][index];
        }
    });
    const newValue = newData[selectedDay][key].filter((value) => value !== null);
    newData[selectedDay][key] = newValue;

    setLoading(true);

    const response = await setNewData(newData);
    if(!response?.message) {
        await callbackExistence({...apiData}[selectedDay])
        setTotalChanges({...apiData}[selectedDay])
        document.querySelector(`div[data-row-id="${id}"]`)?.remove();
        setLoading(false);
    }
    else {
        error('error in DELETE')
    }
}

function getExistenceValue(object, currency) {
    let buyValue = null;
    let saleValue = null;

    if(currency === 'hryvnia') {
        let buyHryvnia = null;
        let saleHryvnia = null;
        let arr = ['dollar', 'euro'];
        arr.map((el) => {
            if(object[`buy-${el}`] && object[`buy-${el}`].length > 0) {
                object[`buy-${el}`].map((obj) => {
                    buyHryvnia += obj.amount * obj.course;
                });
            }
            if(object[`sale-${el}`] && object[`sale-${el}`].length > 0) {
                object[`sale-${el}`].map((obj) => {
                    saleHryvnia += obj.amount * obj.course;
                });
            }
        });
        return `${saleHryvnia - buyHryvnia}`;
    }

    if(object[`buy-${currency}`] && object[`buy-${currency}`].length > 0) {
        object[`buy-${currency}`].map((obj) => {
            buyValue += obj.amount;
        });
    }
    if(object[`sale-${currency}`] && object[`sale-${currency}`].length > 0) {
        object[`sale-${currency}`].map((obj) => {
            saleValue += obj.amount;
        })
    }
    return `${buyValue - saleValue}`;
}


function setExistence(object, currency) {
    document.querySelector(`#existing-morning .${currency}`).innerHTML = "";
    document.querySelector(`#existing-current .${currency}`).innerHTML = "";

    if(object["existence-morning"]) {
        let existenceValue = getExistenceValue(object, currency);
        document.querySelector(`#existing-morning .${currency}`).innerHTML = `${parseInt(object["existence-morning"][`${currency}`])}`;
        document.querySelector(`#existing-current .${currency}`).innerHTML = `${parseInt(object["existence-morning"][`${currency}`]) + parseInt(existenceValue)}`;
        return false;
    }
    else {
        document.querySelector(`#existing-morning .${currency}`).innerHTML = "0";
        document.querySelector(`#existing-current .${currency}`).innerHTML = "0";
        return 0;
    }
}

async function setTable(data) {
    buyDollarTable.innerHTML = null;
    buyEuroTable.innerHTML = null;
    saleDollarTable.innerHTML = null;
    saleEuroTable.innerHTML = null;

    if(data["buy-dollar"]?.length > 0) {
        data["buy-dollar"].map((obj) => {
            const row = createRow('buy-dollar', obj);
            buyDollarTable.innerHTML = buyDollarTable.innerHTML + row;
        });
    }

    if(data["sale-dollar"]?.length > 0) {
        data["sale-dollar"].map((obj) => {
            const row = createRow('sale-dollar', obj);
            saleDollarTable.innerHTML = saleDollarTable.innerHTML + row;
        });
    }

    if(data["buy-euro"]?.length > 0) {
        data["buy-euro"].map((obj) => {
            const row = createRow('buy-euro', obj);
            buyEuroTable.innerHTML = buyEuroTable.innerHTML + row;
        });
    }

    if(data["sale-euro"]?.length > 0) {
        data["sale-euro"].map((obj) => {
            const row = createRow('sale-euro', obj);
            saleEuroTable.innerHTML = saleEuroTable.innerHTML + row;
        });
    }

    setTotalChanges(data);

    if(data["existence-morning"]) {
       await callbackExistence(data)
    }

}

async function checkForBinId(data, year, month) {
    let binName = `${year}-${month}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            'X-Master-Key': masterKey,
            'X-Bin-Name': binName
        },
        body: JSON.stringify({"data": {}})
    }).then((resp) => resp.json());

    if(response?.metadata?.id) {
        let newData = data;

        if(!newData[year]) {
            newData[year] = {}
        }

        newData[year][month] = response?.metadata?.id;

        const putResponse = setNewData(newData, '62af311e402a5b38022f1d09');

        if(!putResponse.message) {
            return response?.metadata?.id;
        }
        else {
            error('Something went wrong');
            return false;
        }
    }
    else {
        error('Bin id is not defined');
        return false;
    }
}

async function setStorageUrl() {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

    const selectedYear = selectedDay?.split('-')[0];

    const selectedMonth = parseInt(selectedDay?.split('-')[1]) - 1;

    if(!selectedYear && !selectedMonth || selectedYear === "") {
        error('Ошибка в дате. Набрать Ярику +380951017683');
        return false;
    }

    const response = await fetch(url + '/62af311e402a5b38022f1d09/latest', {
        method: 'GET',
        headers: {
            'Content-type': 'application/json',
            'X-Master-Key': masterKey,
        }
    }).then((resp) => resp.json());

    let responseData = response["record"];

    let responseUrl = responseData[selectedYear] && responseData[selectedYear][months[selectedMonth]];

    if(responseUrl) {
        return responseUrl;
    }

    if(!responseUrl) {


        const binId = checkForBinId(responseData, selectedYear, months[selectedMonth]);
        return binId;
    }
}

let previousYear =  selectedDay.split('-')[0];
let previousMonth = parseInt(selectedDay.split('-')[1]) - 1;

async function getData() {

    const selectedYear = selectedDay.split('-')[0];
    const selectedMonth = parseInt(selectedDay.split('-')[1]) - 1;

    setLoading(true);

    if(apiData && selectedMonth === previousMonth && selectedYear === previousYear) {
        if(apiData[selectedDay]) {
            setLoading(false);
            return apiData[selectedDay];
        }
        if(!apiData[selectedDay]) {
            setLoading(false);
            return noData();
        }
    }

    previousYear = selectedYear;
    previousMonth = selectedMonth;


    const storageURL = await setStorageUrl();

    if(!storageURL) {
        setLoading(false)
        return false;
    }
    binId = storageURL;

    const response = await fetch(url + `/${binId}/latest`, {
        method: 'GET',
        headers: {
            'Content-type': 'application/json',
            'X-Master-Key': masterKey,
        }
    }).then((response) => response.json());

    apiData = response["record"]["data"] ? {...response["record"]["data"]} : null;
    const obj = response["record"]["data"][selectedDay] ? response["record"]["data"][selectedDay] : false;
    if(!obj) {
        if(selectedDay === now.getFullYear()+"-"+(month)+"-"+(day)) {
            apiData[selectedDay] = {
                "buy-euro": [],
                "sale-euro": [],
                "buy-dollar": [],
                "sale-dollar": [],
            }

            let existence = {
                "dollar": setExistence(apiData[selectedDay], "dollar"),
                "euro": setExistence(apiData[selectedDay], "euro"),
                "hryvnia": setExistence(apiData[selectedDay], "hryvnia"),
            }
            apiData[selectedDay]["existence-morning"] = existence;
            const newData = {...apiData};
            const response = await setNewData(newData);
            if(!response?.message) {
                await callbackExistence(apiData[selectedDay]);
                setTotalChanges(apiData[selectedDay]);
                setLoading(false);
                return apiData[selectedDay];
            }
        }
        else {
            setLoading(false);
            return noData();
        }
    }
    else if (obj) {
        await callbackExistence(obj);
        setTotalChanges(obj);
        setLoading(false);
        return obj;
    }
}

async function putData(type, currency, obj) {
    let dateExists = apiData[selectedDay];
    if(!dateExists) {
        apiData[selectedDay] = {
            "buy-euro": [],
            "sale-euro": [],
            "buy-dollar": [],
            "sale-dollar": [],
        }
        apiData[selectedDay][`${type}-${currency}`].push(obj);
    };
    if(dateExists) {
        dateExists[`${type}-${currency}`].push(obj)
    };

    let newData = {...apiData};
    setLoading(true);
    const response = await setNewData(newData);
    if(!response?.message) {
        await callbackExistence({...apiData}[selectedDay])
        setTotalChanges({...apiData}[selectedDay])
        setLoading(false);
    }
    return response;
}

function selectMobileOption(value) {
    let type = value.split('-')[0];
    let currency = value.split('-')[1];
    document.querySelectorAll('.buy-sale .table').forEach((dom) => dom.style.display = 'none');
    document.querySelector(`#${currency} .${type}`).style.display = 'block';
}

async function setMorningValue(e, currency) {
    const charCode = (e.which) ? e.which : e.keyCode;
    if(charCode === 13) {
        setLoading(true);
        let previousValue = document.querySelector(`#existing-morning .${currency}`);
        let input = document.querySelector(`#existing-morning #morning-${currency}`);
        if(parseInt(previousValue.innerHTML) === parseInt(input.value)) {
            previousValue.style.display = null;
            input.style.display = null;
        }
        else {
            let newData = apiData;
            newData[selectedDay]["existence-morning"][currency] = parseInt(input.value);
            const response = await setNewData(newData);
            if(!response?.message) {
                previousValue.style.display = null;
                input.style.display = null;
                await callbackExistence(newData[selectedDay]);
                setTotalChanges(newData[selectedDay]);
                setLoading(false);
            }
            else {
                error('Ошибка. Расходы не выставлены');
                setLoading(false);
            }
        }
    }
}
function setExistingHandles() {
    let arr = ['dollar', 'euro', 'hryvnia'];
    arr.map((currency) => {
        document.querySelector(`#existing-morning .${currency}-tab`).addEventListener('dblclick', () => {
            if(!(selectedDay === now.getFullYear()+"-"+(month)+"-"+(day))) {
                return false;
            }
            let previousValue = document.querySelector(`#existing-morning .${currency}`);
            let input = document.querySelector(`#existing-morning #morning-${currency}`);
            input.style.display = "block";
            input.value = parseInt(previousValue.innerHTML);
            previousValue.style.display = 'none';
        });
    });
}

async function checkForPass() {
    let pass = localStorage.getItem('masterKey') ? localStorage.getItem('masterKey') : prompt('Введите пароль');
    if(pass === null || pass === "") {
        if(confirm('Введите действительный пароль')) {
            return checkForPass();
        }
        else {
            return false;
        }
    }
    else {
        const response = await getBotData(pass);
        if(!response?.message) {
            localStorage.setItem('masterKey', pass);
            bot.token = response["record"]["token"];
            bot.id = response["record"]["id"];
            bot.dollarValue = response["record"]["dollarValue"];
            bot.totalSend = response["record"]["totalSend"];
            masterKey = pass;
        }
        else {
            if(confirm('Введите действительный пароль')) {
                return checkForPass();
            }
            else {
                return false;
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', async () => {

    await checkForPass();
    let calendar = document.getElementById('calendar');
    let mobileSelect = document.getElementById('mobile-select');
    calendar.setAttribute('value', selectedDay);

    handleAddRow();

    if(selectedDay === now.getFullYear()+"-"+(month)+"-"+(day)) {
        setExistingHandles();
    }

    if(window.innerWidth < 690) {
        selectMobileOption('buy-dollar');
    }

    mobileSelect.onchange = (e) => {
        selectMobileOption(e.target.value)
    };

    calendar.onchange = async (e) => {
        selectedDay = e.target.value;
        handleAddRow();
        if(apiData[selectedDay]) {
            return setTable(apiData[selectedDay]);
        }
        else {
            const obj = await getData();
            if(!obj) {
                return noData();
            }
            return setTable(obj);
        }
    }

    const obj = await getData();
    if(!obj) {
        return noData();
    }
    return setTable(obj);
})
