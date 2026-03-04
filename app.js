import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// นำเข้า Firebase Storage
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyA87_IkAGM7-85Bckfpu6ZMiIDRESWUGgM",
  authDomain: "unilost-422dc.firebaseapp.com",
  projectId: "unilost-422dc",
  storageBucket: "unilost-422dc.firebasestorage.app",
  messagingSenderId: "582268756311",
  appId: "1:582268756311:web:a32daeaf588e88f20e9e12",
  measurementId: "G-TZFW7VSGNJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app); // เรียกใช้ Storage

const itemForm = document.getElementById('itemForm');
const itemList = document.getElementById('itemList');
const imageUpload = document.getElementById('imageUpload');
const fileNameDisplay = document.getElementById('fileName');
const submitBtn = document.getElementById('submitBtn');

// แสดงชื่อไฟล์เมื่อเลือกรูปภาพ
imageUpload.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        fileNameDisplay.textContent = e.target.files[0].name;
    } else {
        fileNameDisplay.textContent = "ยังไม่ได้เลือกไฟล์";
    }
});

itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // เปลี่ยนสถานะปุ่มเพื่อป้องกันการกดซ้ำตอนกำลังอัปโหลด
    submitBtn.disabled = true;
    submitBtn.textContent = "กำลังอัปโหลดข้อมูล...";

    const type = document.getElementById('type').value;
    const itemName = document.getElementById('itemName').value;
    const description = document.getElementById('description').value;
    const contact = document.getElementById('contact').value;
    const file = imageUpload.files[0];

    let imageUrl = "";

    try {
        // ถ้ายูสเซอร์แนบรูปมา ให้ทำการอัปโหลดขึ้น Firebase Storage ก่อน
        if (file) {
            // สร้างชื่อไฟล์ไม่ให้ซ้ำด้วยเวลาปัจจุบัน
            const storageRef = ref(storage, 'unilost_images/' + Date.now() + '_' + file.name);
            await uploadBytes(storageRef, file);
            imageUrl = await getDownloadURL(storageRef); // ขอ URL รูปที่อัปโหลดเสร็จ
        }

        // บันทึกข้อมูลข้อความ + URL รูป (ถ้ามี) ลง Firestore
        await addDoc(collection(db, "items"), {
            type: type,
            itemName: itemName,
            description: description,
            contact: contact,
            imageUrl: imageUrl, 
            timestamp: serverTimestamp()
        });
        
        itemForm.reset();
        fileNameDisplay.textContent = "ยังไม่ได้เลือกไฟล์";
        alert("บันทึกข้อมูลเรียบร้อยแล้ว!");
    } catch (error) {
        console.error("Error: ", error);
        alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "บันทึกข้อมูล";
    }
});

// ดึงข้อมูลมาแสดงผลแบบ Real-time
const q = query(collection(db, "items"), orderBy("timestamp", "desc"));

onSnapshot(q, (snapshot) => {
    itemList.innerHTML = ""; 
    
    if(snapshot.empty) {
        itemList.innerHTML = "<p class='loading-text'>ยังไม่มีรายการแจ้งเข้ามา</p>";
        return;
    }

    snapshot.forEach((doc) => {
        const data = doc.data();
        const card = document.createElement('div');
        card.className = 'item-card';
        
        const typeLabel = data.type === 'lost' ? 'ของหาย' : 'พบของ';
        const typeClass = data.type === 'lost' ? 'lost' : 'found';
        
        let timeString = '';
        if (data.timestamp) {
            timeString = data.timestamp.toDate().toLocaleString('th-TH');
        }

        // ตรวจสอบว่ามีรูปภาพไหม ถ้ามีให้แสดงแท็ก img
        const imageHTML = data.imageUrl ? `<img src="${data.imageUrl}" alt="Item Image">` : '';

        card.innerHTML = `
            ${imageHTML}
            <span class="badge ${typeClass}">${typeLabel}</span>
            <h3>${data.itemName}</h3>
            <p><strong>รายละเอียด:</strong> ${data.description}</p>
            <p><strong>ติดต่อ:</strong> ${data.contact}</p>
            <p class="timestamp">${timeString}</p>
        `;
        
        itemList.appendChild(card);
    });
});
