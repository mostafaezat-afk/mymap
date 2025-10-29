// ocr.js - معالجة استخراج النص من الصور

let currentImage = null;

// معالجة رفع الصورة
document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            currentImage = event.target.result;
            document.getElementById('preview-image').src = currentImage;
            document.getElementById('preview-section').classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    }
});

// منطقة السحب والإفلات
const dropZone = document.getElementById('drop-zone');
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-primary');
});

dropZone.addEventListener('dragleave', (e) => {
    dropZone.classList.remove('border-primary');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-primary');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                currentImage = event.target.result;
                document.getElementById('preview-image').src = currentImage;
                document.getElementById('preview-section').classList.remove('d-none');
            };
            reader.readAsDataURL(file);
        }
    }
});

// معالجة الصورة واستخراج النص
async function processImage() {
    if (!currentImage) return;
    
    // إظهار شريط التقدم
    document.getElementById('progress-section').classList.remove('d-none');
    document.getElementById('preview-section').classList.add('d-none');
    
    try {
        const result = await Tesseract.recognize(
            currentImage,
            'ara+eng',
            {
                logger: (m) => {
                    console.log(m);
                    if (m.status === 'recognizing text') {
                        const progress = Math.round(m.progress * 100);
                        document.getElementById('progress-bar').style.width = progress + '%';
                        document.getElementById('progress-text').textContent = 
                            `التقدم: ${progress}%`;
                    }
                }
            }
        );
        
        console.log('النص المستخرج:', result.data.text);
        
        // استخراج البيانات من النص
        const extractedData = extractNumbers(result.data.text);
        
        // ملء النموذج بالبيانات المستخرجة
        fillForm(extractedData);
        
        // إخفاء شريط التقدم وعرض النموذج
        document.getElementById('progress-section').classList.add('d-none');
        document.getElementById('data-form').classList.remove('d-none');
        
    } catch (error) {
        console.error('خطأ في معالجة الصورة:', error);
        alert('حدث خطأ في معالجة الصورة. يرجى المحاولة مرة أخرى.');
        resetForm();
    }
}

// استخراج الأرقام من النص
function extractNumbers(text) {
    // البحث عن الأرقام في النص
    const numbers = text.match(/\d+[.,]?\d*/g) || [];
    
    // محاولة تحديد البيانات بناءً على الأنماط
    const data = {
        supplyCards: 0,
        supplyAmount: 0,
        supplyTotal: 0,
        exchangeCards: 0,
        exchangeAmount: 0
    };
    
    // منطق بسيط لاستخراج البيانات
    // يمكن تحسينه بناءً على نمط الصور الفعلية
    if (numbers.length >= 5) {
        data.supplyCards = parseInt(numbers[0]) || 0;
        data.supplyAmount = parseFloat(numbers[1]) || 0;
        data.supplyTotal = parseFloat(numbers[2]) || 0;
        data.exchangeCards = parseInt(numbers[3]) || 0;
        data.exchangeAmount = parseFloat(numbers[4]) || 0;
    }
    
    return data;
}

// ملء النموذج بالبيانات
function fillForm(data) {
    const now = new Date();
    document.getElementById('date').value = now.toISOString().split('T')[0];
    document.getElementById('time').value = now.toTimeString().split(' ')[0].substring(0, 5);
    
    document.getElementById('supply-cards').value = data.supplyCards;
    document.getElementById('supply-amount').value = data.supplyAmount;
    document.getElementById('supply-total').value = data.supplyTotal;
    document.getElementById('exchange-cards').value = data.exchangeCards;
    document.getElementById('exchange-amount').value = data.exchangeAmount;
}

// حفظ البيانات
document.getElementById('extractedDataForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const data = {
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        supplyCards: parseInt(document.getElementById('supply-cards').value) || 0,
        supplyAmount: parseFloat(document.getElementById('supply-amount').value) || 0,
        supplyTotal: parseFloat(document.getElementById('supply-total').value) || 0,
        exchangeCards: parseInt(document.getElementById('exchange-cards').value) || 0,
        exchangeAmount: parseFloat(document.getElementById('exchange-amount').value) || 0,
        notes: document.getElementById('notes').value,
        image: currentImage,
        timestamp: new Date().toISOString()
    };
    
    try {
        await saveToDatabase(data);
        alert('تم حفظ البيانات بنجاح!');
        window.location.href = '../index.html';
    } catch (error) {
        console.error('خطأ في حفظ البيانات:', error);
        alert('حدث خطأ في حفظ البيانات.');
    }
});

// إعادة تعيين النموذج
function resetForm() {
    currentImage = null;
    document.getElementById('preview-section').classList.add('d-none');
    document.getElementById('progress-section').classList.add('d-none');
    document.getElementById('data-form').classList.add('d-none');
    document.getElementById('imageInput').value = '';
}