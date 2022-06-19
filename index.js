const url = "https://api.jsonbin.io/v3/b";
let binId = "";

let bot = {
    TOKEN: "",
    ID: ""
}
let masterKey = "";


const sendMessage = async (dollarLess) => {
    if(bot.TOKEN === "" || bot.ID === "") {
        error('telegram problem');
        return false;
    }
    return await fetch(`https://api.telegram.org/bot${bot.TOKEN}/sendMessage?chat_id=${bot.ID}&text=Доллар+${dollarLess ? 'меньше' : 'больше'}+1000`);
}

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

async function setExpanses() {
    let value = parseInt(document.getElementById('expanses').value);
    if(isNaN(value) || !(selectedDay === now.getFullYear()+"-"+(month)+"-"+(day))) {
        error('Ошибка при выставлении расходов');
        return false;
    }
    else {
        const newData = apiData;
        newData[selectedDay]["expenses"] = value;
        setLoading(true);
        const response = await setNewData(newData);
        if(!response?.message) {
            await callbackExistence(newData[selectedDay]);
            setTotalChanges(newData[selectedDay]);
            setLoading(false);
            alert('Выставлено!');
        }
        else {
            error('Ошибка. Расходы не выставлены');
        }
    }
}

async function setDollarValue (value) {
    return await fetch(url + '/62adc661449a1f38210eb394', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': masterKey,
        },
        body: JSON.stringify({"dollarLess": value})
    }).then((response) => response.json());
}

async function callbackExistence(data) {
    setExistence(data, 'dollar');
    setExistence(data, 'euro');
    setExistence(data, 'hryvnia');

    let dollarValue = parseInt(document.querySelector(`#existing-current .dollar`).innerHTML);
    const response = await fetch(url + '/62adc661449a1f38210eb394/latest', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': masterKey,
        }
    }).then((response) => response.json());

    if(!response["record"]["dollarLess"] && dollarValue < 1000) {
        const setDollar = await setDollarValue(true);
        if(setDollar.success) {
            const messageSent = await sendMessage(false);
            if(!messageSent.ok) {
                error('Telegram Message error');
            }
        }
    }
    if(response["record"]["dollarLess"] && dollarValue > 1000)  {
        const setDollar = await setDollarValue(false);
        if(setDollar.success) {
            const messageSent = await sendMessage(false);
            if(!messageSent.ok) {
                error('Telegram Message error');
            }
        }
    }
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
    document.getElementById('expanses').value = "";
    document.querySelectorAll('.total .col').forEach((el) => {
        el.innerHTML = ""
    });
    let arr = ['dollar', 'euro', 'hryvnia'];
    arr.map((el) => {
        document.querySelector(`#existing-current .${el}`).innerHTML = "";
        document.querySelector(`#existing-morning .${el}`).innerHTML = "";
    });
}


function changeRow (id, type) {
    const input = document.querySelector(`div[data-row-id="${id}"] #change-${type}`);
    const currentValue = document.querySelector(`div[data-row-id="${id}"] #${type}`);
    const button = document.querySelector(`div[data-row-id="${id}"] .change-${type}-btn`);
    button.style.display = "none";
    currentValue.style.display = "none";
    input.style.display = "block";
    input.value = currentValue.innerHTML;
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
    return false;
}

async function setRowData(e, id, key, type) {
    const charCode = (e.which) ? e.which : e.keyCode;
    if(charCode === 13) {
        let value = apiData[selectedDay][key].find((obj) => obj.id === id)[type];

        if(value && parseFloat(e.target.value) !== value) {
            apiData[selectedDay][key].find((obj) => obj.id === id)[type] = parseFloat(e.target.value)
            const newData = {...apiData};
            const response = await setNewData(newData);
            setLoading(true);
            if(!response?.message) {
                await callbackExistence({...apiData}[selectedDay])
                setTotalChanges({...apiData}[selectedDay]);
                rowChanged(id, type, e.target.value);
                setLoading(false);
            }
            else {
                alert('Ошибка при изменении');
                rowChanged(id, type, parseFloat(e.target.value));
            }
        }
        if(parseFloat(e.target.value) === value) {
            rowChanged(id, type, parseFloat(e.target.value))
        }
        if(!value) {
            alert('Ошибка при изменении');
            rowChanged(id, type, parseFloat(e.target.value))
        }
    }
}

function createRow(key, obj) {
    return `<div class="row" data-row-id="${obj["id"]}">
                <div data-type="amount" class="col">
                    <span id="amount">${obj["amount"]}</span>
                    <input class="change-input" onkeypress="setRowData(event, ${obj["id"]}, '${key}', 'amount')" id="change-amount" type="number" step="0.0001" />
                    <button onclick="changeRow(${obj["id"]}, 'amount')" class="change-amount-btn ${selectedDay === now.getFullYear()+"-"+(month)+"-"+(day) ? 'visible' : ''}">изменить</button>
                </div>
                <div data-type="course" class="col">
                    <span id="course">${obj["course"]}</span>
                    <input class="change-input" onkeypress="setRowData(event, ${obj["id"]}, '${key}', 'course')" id="change-course" type="number" step="0.0001" />
                    <button onclick="changeRow(${obj["id"]}, 'course')" class="change-course-btn ${selectedDay === now.getFullYear()+"-"+(month)+"-"+(day) ? 'visible' : ''}">изменить</button>
                </div>
                <div class="col">
                    <span data-type="sum">${(obj["amount"] * obj["course"]).toFixed(2)}</span>
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

    if(inputSum?.value && inputCourse?.value) {
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
        if(object["expenses"]) {
            return  `${saleHryvnia - buyHryvnia - parseInt(object["expenses"])}`
        }
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
    else if(Object?.keys(apiData)?.length > 1) {
        const orderedDates = {};
        Object.keys(apiData).sort(function(a, b) {
            return a.split('-').reverse().join('').localeCompare(b.split('-').reverse().join(''));
        }).forEach(function(key) {
            orderedDates[key] = apiData[key];
        });
        const arrayOfObjects = Object.values(orderedDates);
        const lastObject = arrayOfObjects[arrayOfObjects.length - 2];
        let existenceValue = getExistenceValue(lastObject, currency);
        return parseInt(lastObject["existence-morning"][`${currency}`]) + parseInt(existenceValue);
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

    document.getElementById('expanses').value = data["expenses"] ? data["expenses"] : "";

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


let previousSelectedYear = null;
let previousSelectedMonth = null;

async function setStorageUrl() {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

    const selectedYear = selectedDay.split('-')[0];
    const selectedMonth = parseInt(selectedDay.split('-')[1].replace('0', '')) - 1;

    if(previousSelectedYear === selectedYear && previousSelectedMonth === selectedMonth) {
        return binId;
    }

    previousSelectedYear = selectedYear;
    previousSelectedMonth = selectedMonth;

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
        if(selectedMonth !== parseInt(month.replace('0', '')) - 1) {
            error('Нет значений за месяц ' + months[selectedMonth]);
            return false;
        }
        alert('Выставите наличие на утро!')
        const binId = checkForBinId(responseData, selectedYear, months[selectedMonth]);
        return binId;
    }
}

async function getData() {
    setLoading(true);

    if(apiData) {
        if(apiData[selectedDay]) {
            setLoading(false);
            return apiData[selectedDay];
        }
    }

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
        const response = await fetch(url + '/62adc661449a1f38210eb394/latest', {
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
                'X-Master-Key': pass,
            }
        }).then((response) => response.json());
        if(!response?.message) {
            localStorage.setItem('masterKey', pass);
            bot.TOKEN = response["record"]["token"];
            bot.ID = response["record"]["id"];
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
