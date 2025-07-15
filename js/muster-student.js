import { fetchGoogleSheet } from './connect.js';

const eventSelect = document.getElementById('event-select');
const studentIdInput = document.getElementById('student-id');
const submitBtn = document.getElementById('submit-btn');
const passCodeInput = document.getElementById("pass-code");

const customMessageBox = document.getElementById('custom-message-box');
const customMessageText = document.getElementById('custom-message-text');
const customMessageOkBtn = document.getElementById('custom-message-ok-btn');

const URL_GAS = "https://script.google.com/macros/s/AKfycbweSKnUjp_KKmbeBF57ITQd4uS1nuebcCQimEjNUy2hXULo5rRUUlp3ga1Q4h1Ig3En/exec";

// Hiển thị thông báo
function showCustomMessageBox(message, onOk = () => {}) {
    customMessageText.textContent = message;
    customMessageBox.style.display = 'flex';
    customMessageOkBtn.onclick = () => {
        customMessageBox.style.display = 'none';
        onOk();
    };
}

// Tải danh sách sự kiện
async function loadEvents() {
    try {
        const data = await fetchGoogleSheet("CONG_BO");
        const eventNames = [...new Set(data
            .filter(row => row.status === "Duyệt" && row.nameEvent)
            .map(row => row.nameEvent))
        ];

        eventNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            eventSelect.appendChild(option);
        });
    } catch (err) {
        console.error("Error loading events:", err);
        showCustomMessageBox("Không thể tải danh sách sự kiện. Vui lòng kiểm tra kết nối.");
    }
}

// Gửi dữ liệu lên Google Sheet
async function sendDataToSheet(studentList, eventName, passcode) {
    try {
        await fetch(URL_GAS, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                data: studentList,
                eventName: eventName,
                passcode: passcode,
            }),
            mode: 'no-cors'
        });

        return true;

    } catch (err) {
        console.error("Lỗi gửi dữ liệu:", err);
        showCustomMessageBox("❌ Không thể gửi dữ liệu. Vui lòng kiểm tra kết nối.");
        return false;
    }
}

// Gửi dữ liệu khi bấm "Điểm danh"
async function submitList() {
    // Vô hiệu hóa nút gửi trong lúc đang xử lý
    submitBtn.disabled = true;
    submitBtn.textContent = "Đang gửi...";

    const selectedEvent = eventSelect.value;
    const passcode = passCodeInput.value;
    const mssv = studentIdInput.value.trim();

    if (!selectedEvent) {
        showCustomMessageBox("Vui lòng chọn sự kiện.", () => {
            submitBtn.disabled = false;
            submitBtn.textContent = "Gửi";
        });
        return;
    }

    if (!passcode) {
        showCustomMessageBox("Vui lòng nhập mã quản trị.", () => {
            submitBtn.disabled = false;
            submitBtn.textContent = "Gửi";
        });
        return;
    }

    if (!mssv) {
        showCustomMessageBox("Vui lòng nhập MSSV.", () => {
            submitBtn.disabled = false;
            submitBtn.textContent = "Gửi";
        });
        return;
    }

    if (mssv.length !== 8) {
        showCustomMessageBox("MSSV không hợp lệ. Phải có 8 ký tự.", () => {
            submitBtn.disabled = false;
            submitBtn.textContent = "Gửi";
        });
        return;
    }

    const success = await sendDataToSheet([mssv], selectedEvent, passcode);

    if (success) {
        showCustomMessageBox(`✅ MSSV ${mssv} đã được điểm danh.`, () => {
            studentIdInput.value = "";
            studentIdInput.focus();
        });
    }

    // Bật lại nút gửi sau khi hoàn tất
    submitBtn.disabled = false;
    submitBtn.textContent = "Gửi";
}


document.addEventListener("DOMContentLoaded", async () => {
    await loadEvents();

    submitBtn.addEventListener("click", submitList);

    studentIdInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            submitList();
        }
    });
});
