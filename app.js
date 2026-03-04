// Import ฟังก์ชันที่จำเป็นจาก Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Firebase Configuration ของคุณ
const firebaseConfig = {
  apiKey: "AIzaSyA87_IkAGM7-85Bckfpu6ZMiIDRESWUGgM",
  authDomain: "unilost-422dc.firebaseapp.com",
  projectId: "unilost-422dc",
  storageBucket: "unilost-422dc.firebasestorage.app",
  messagingSenderId: "582268756311",
  appId: "1:582268756311:web:a32daeaf588e88f20e9e12",
  measurementId: "G-TZFW7VSGNJ"
};

// เริ่มต้นใช้งาน Firebase และ Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// อ้างอิง Elements จาก HTML
const itemForm = document.getElementById('itemForm');
const itemList = document.getElementById('itemList');

// ฟังก์ชัน: บันทึกข้อมูลลง Firestore เมื่อกด Submit ฟอร์ม
itemForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // ป้องกันการรีเฟรชหน้าเว็บ
    
    // ดึงค่าจากฟอร์ม
    const type = document.getElementById('type').value;
    const itemName = document.getElementById('itemName').value;
    const description = document.getElementById('description').value;
    const contact = document.getElementById('contact').value;

    try {
        // เพิ่มข้อมูลลงใน Collection ชื่อ "items"
        await addDoc(collection(db, "items"), {
            type: type,
            itemName: itemName,
            description: description,
            contact: contact,
            timestamp: serverTimestamp() // ใช้เวลาจากเซิร์ฟเวอร์
        });
        
        itemForm.reset(); // ล้างข้อมูลในฟอร์มหลังบันทึกเสร็จ
        alert("บันทึกข้อมูลเรียบร้อยแล้ว!");
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
});

// ฟังก์ชัน: ดึงข้อมูลจาก Firestore มาแสดงผลแบบ Real-time
// สร้าง Query เรียงลำดับจากรายการล่าสุด (desc) ไปเก่าสุด
const q = query(collection(db, "items"), orderBy("timestamp", "desc"));

onSnapshot(q, (snapshot) => {
    itemList.innerHTML = ""; // ล้างข้อมูลเก่าก่อน
    
    if(snapshot.empty) {
        itemList.innerHTML = "<p style='text-align:center;'>ยังไม่มีรายการแจ้งเข้ามา</p>";
        return;
    }

    snapshot.forEach((doc) => {
        const data = doc.data();
        
        // สร้าง Card สำหรับแต่ละรายการ
        const card = document.createElement('div');
        card.className = `item-card ${data.type}`;
        
        const typeLabel = data.type === 'lost' ? '🚨 ของหาย' : '✅ พบของ';
        
        // จัดการเวลา
        let timeString = 'กำลังบันทึกเวลา...';
        if (data.timestamp) {
            timeString = data.timestamp.toDate().toLocaleString('th-TH');
        }

        card.innerHTML = `
            <span class="badge ${data.type}">${typeLabel}</span>
            <h3>${data.itemName}</h3>
            <p><strong>รายละเอียด:</strong> ${data.description}</p>
            <p><strong>ติดต่อกลับ:</strong> ${data.contact}</p>
            <p class="timestamp">🕒 ${timeString}</p>
        `;
        
        itemList.appendChild(card);
    });
});
