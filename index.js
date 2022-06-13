const url = "https://api.jsonbin.io/b/62a5d2ca402a5b380224b78e";
const dollarLessUrl = "https://api.jsonbin.io/b/62a71866449a1f382106c1aa";

const bot = {
    TOKEN: "5313779670:AAH4477DVLb3MgzTo5hYlWnim-pEuFAMSzU",
    ID: "404991904"
}


const sendMessage = async (dollarLess) => {
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

async function setNewData(newData) {
    return fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({"data": {...newData}})
    }).then((response) => response.json());
}

async function setExpanses() {
    let value = parseInt(document.getElementById('expanses').value);
    if(isNaN(value) || !value || !(selectedDay === now.getFullYear()+"-"+(month)+"-"+(day))) {
        error('Ошибка при выставлении расходов');
        return false;
    }
    else {
        const newData = apiData;
        newData[selectedDay]["expenses"] = value;
        setLoading(true);
        const response = await setNewData(newData);
        if(response.success) {
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
    return await fetch(dollarLessUrl, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({"dollarLess": value})
    }).then((response) => response.json());
}

async function callbackExistence(data) {
    setExistence(data, 'dollar');
    setExistence(data, 'euro');
    setExistence(data, 'hryvnia');

    let dollarValue = parseInt(document.querySelector(`#existing-current .dollar`).innerHTML);
    const response = await fetch(dollarLessUrl + '/latest', {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then((response) => response.json());

    if(!response["dollarLess"] && dollarValue < 1000) {
        const setDollar = await setDollarValue(true);
        if(setDollar.success) {
            const messageSent = await sendMessage(false);
            console.log(messageSent)
            if(!messageSent.ok) {
                error('Telegram Message error');
            }
        }
    }
    if(response["dollarLess"] && dollarValue > 1000)  {
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
}

function createRow(key, obj) {
    return `<div class="row" data-row-id="${obj["id"]}">
                <div data-type="amount" class="col">
                    ${obj["amount"]}
                </div>
                <div  data-type="course" class="col">
                    ${obj["course"]}
                </div>
                <div class="col">
                    <span data-type="sum">${obj["amount"] * obj["course"]}</span>
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
            "amount": parseInt(inputSum.value),
            "course": parseInt(inputCourse.value),
            "time": now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes(),
        }
        const response = await putData(type, currency, obj);
        if(response?.success) {
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
    document.querySelector(`#${currency} .${type} div[data-total="amount"]`).innerHTML = `${totalAmount}`;
    document.querySelector(`#${currency} .${type} div[data-total="course"]`).innerHTML = `${averageCourse}`;
    document.querySelector(`#${currency} .${type} div[data-total="sum"]`).innerHTML = `${totalSum}`;
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

function removeAddRow() {
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
    if(response.success) {
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
    else {
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
    if(!data["existence-morning"]) {
        let obj = {
            "dollar": setExistence(data, 'dollar'),
            "euro": setExistence(data, 'euro'),
            "hryvnia": setExistence(data, 'hryvnia')
        }
        apiData[selectedDay]["existence-morning"] = obj;
        const newData =  {...apiData};
        setLoading(true);
        const response = await setNewData(newData);
        if(response.success) {
            setLoading(false);
            return response;
        }
        else {
            error('Ошибка при PUT');
        }
    }

}

async function getData() {
    setLoading(true);
    const response = await fetch(url + '/latest', {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then((response) => response.json());
    apiData = response["data"] ? {...response["data"]} : null;
    console.log(response)
    removeAddRow();
    const obj = response["data"][selectedDay] ? response["data"][selectedDay] : false;
    if(!obj) {
        apiData[selectedDay] = {
            "buy-euro": [],
            "sale-euro": [],
            "buy-dollar": [],
            "sale-dollar": [],
        }
        const newData = {...apiData};
        const response = await setNewData(newData)

        if(response.success) {
            await callbackExistence(response["data"][selectedDay]);
            setTotalChanges(response["data"][selectedDay]);
            setLoading(false);
            return obj;
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
    if(response?.success) {
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

document.addEventListener('DOMContentLoaded', async () => {
    let calendar = document.getElementById('calendar');
    let mobileSelect = document.getElementById('mobile-select');
    calendar.setAttribute('value', selectedDay);
    if(window.innerWidth < 590) {
        selectMobileOption('buy-dollar');
    }
    mobileSelect.onchange = (e) => {
        selectMobileOption(e.target.value)
    };

    calendar.onchange = async (e) => {
        selectedDay = e.target.value;
        const obj = await getData();
        !obj ? noData() : setTable(obj);
    }

    const obj = await getData();
    console.log(obj);
    !obj ? noData() : setTable(obj);
})
