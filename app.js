class QuranPlayer {
    constructor() {
        this.surahSelect = document.getElementById('surah-select');
        this.reciterSelect = document.getElementById('reciter-select');
        this.startVerse = document.getElementById('start-verse');
        this.endVerse = document.getElementById('end-verse');
        this.repeatCount = document.getElementById('repeat-count');
        this.playBtn = document.getElementById('play-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.progressContainer = document.querySelector('.progress-container');
        this.progressBar = document.querySelector('.progress-bar');
        this.timeDisplay = document.querySelector('.time-display');
        this.versesContainer = document.getElementById('verses-container');
        this.audio = document.getElementById('quran-audio');
        
        this.currentSurah = null;
        this.currentVerses = [];
        this.currentVerseIndex = 0;
        this.verseRepeatCounts = {}; // تخزين عدد مرات التكرار لكل آية
        this.shouldPlayBasmala = false;
        this.isRepeating = false; // متغير جديد لتتبع حالة التكرار
        
        this.initializeEventListeners();
        this.loadSurahs();
    }
    
    async loadSurahs() {
        try {
            const response = await fetch('https://api.alquran.cloud/v1/surah');
            const data = await response.json();
            
            if (data.code === 200) {
                data.data.forEach(surah => {
                    const option = document.createElement('option');
                    option.value = surah.number;
                    option.textContent = `${surah.number}. ${surah.name} - ${surah.englishName}`;
                    this.surahSelect.appendChild(option);
                });
                
                this.surahSelect.addEventListener('change', () => this.handleSurahChange());
                this.handleSurahChange();
            }
        } catch (error) {
            console.error('خطأ في تحميل السور:', error);
            alert('حدث خطأ في تحميل قائمة السور. يرجى تحديث الصفحة.');
        }
    }
    
    async handleSurahChange() {
        const surahId = this.surahSelect.value;
        try {
            const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/quran-uthmani`);
            const data = await response.json();
            
            if (data.code === 200) {
                this.currentSurah = data.data;
                
                // تحديث قوائم الآيات
                this.updateVerseDropdowns();
                this.updateVerseDisplay();
                
                // إعادة تعيين عدد مرات التكرار لكل آية
                this.verseRepeatCounts = {};
            }
        } catch (error) {
            console.error('خطأ في تحميل الآيات:', error);
            alert('حدث خطأ في تحميل الآيات. يرجى المحاولة مرة أخرى.');
        }
    }

    updateVerseDropdowns() {
        // تفريغ القوائم المنسدلة
        this.startVerse.innerHTML = '';
        this.endVerse.innerHTML = '';

        // إضافة الآيات إلى القوائم المنسدلة
        this.currentSurah.ayahs.forEach((ayah, index) => {
            const startOption = document.createElement('option');
            const endOption = document.createElement('option');
            
            startOption.value = ayah.numberInSurah;
            endOption.value = ayah.numberInSurah;
            
            // إضافة جزء من نص الآية مع رقمها
            const shortText = ayah.text.substring(0, 30) + (ayah.text.length > 30 ? '...' : '');
            startOption.textContent = `📝 ${ayah.numberInSurah} - ${shortText}`;
            endOption.textContent = `📝 ${ayah.numberInSurah} - ${shortText}`;
            
            this.startVerse.appendChild(startOption);
            this.endVerse.appendChild(endOption);
        });

        // تعيين القيم الافتراضية
        this.startVerse.value = '1';
        this.endVerse.value = Math.min(10, this.currentSurah.numberOfAyahs).toString();
    }
    
    updateVerseDisplay() {
        if (!this.currentSurah) return;
        
        const start = parseInt(this.startVerse.value) - 1;
        const end = parseInt(this.endVerse.value) - 1;
        this.currentVerses = this.currentSurah.ayahs.slice(start, end + 1);
        
        this.versesContainer.innerHTML = '';
        this.currentVerses.forEach((verse, index) => {
            const verseElement = document.createElement('div');
            verseElement.className = 'verse';
            verseElement.dataset.index = index;
            
            // إضافة عداد التكرار لكل آية
            const repeatCount = this.verseRepeatCounts[index] || 0;
            
            verseElement.innerHTML = `
                <span class="verse-number">${verse.numberInSurah}</span>
                <span class="verse-text">${verse.text}</span>
                <div class="verse-repeat-count">
                    <i class="fas fa-redo"></i>
                    <span>${repeatCount}</span>
                </div>
            `;
            
            this.versesContainer.appendChild(verseElement);
        });
    }
    
    async loadAudio(verse) {
        try {
            const reciter = this.reciterSelect.value;
            const surahNumber = this.currentSurah.number.toString().padStart(3, '0');
            const verseNumber = verse.numberInSurah.toString().padStart(3, '0');
            const audioUrl = `https://everyayah.com/data/${reciter}/${surahNumber}${verseNumber}.mp3`;
            console.log('Loading audio from:', audioUrl);
            
            const response = await fetch(audioUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.audio.src = audioUrl;
            
            return new Promise((resolve, reject) => {
                this.audio.onloadeddata = () => {
                    console.log('Audio loaded successfully');
                    resolve();
                };
                this.audio.onerror = (e) => {
                    console.error('Audio loading error:', e);
                    reject(new Error('فشل في تحميل الصوت'));
                };
                this.audio.load();
            });
        } catch (error) {
            console.error('خطأ في تحميل الصوت:', error);
            alert('حدث خطأ في تحميل الصوت. يرجى المحاولة مرة أخرى.');
            throw error;
        }
    }
    
    highlightVerse(index) {
        const verses = this.versesContainer.querySelectorAll('.verse');
        verses.forEach(verse => verse.classList.remove('active'));
        if (verses[index]) {
            verses[index].classList.add('active');
            verses[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateProgress() {
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        this.progressBar.style.width = `${progress}%`;
        
        const currentTime = this.formatTime(this.audio.currentTime);
        const duration = this.formatTime(this.audio.duration || 0);
        this.timeDisplay.textContent = `${currentTime} / ${duration}`;
    }
    
    async playBasmala() {
        try {
            const reciter = this.reciterSelect.value;
            const audioUrl = `https://everyayah.com/data/${reciter}/001001.mp3`;
            this.audio.src = audioUrl;
            
            return new Promise((resolve, reject) => {
                this.audio.onloadeddata = async () => {
                    try {
                        await this.audio.play();
                        this.audio.onended = () => {
                            resolve();
                        };
                    } catch (error) {
                        reject(error);
                    }
                };
                this.audio.onerror = (e) => {
                    reject(new Error('فشل في تحميل صوت البسملة'));
                };
                this.audio.load();
            });
        } catch (error) {
            console.error('خطأ في تشغيل البسملة:', error);
            throw error;
        }
    }
    
    async playVerse(index) {
        if (index >= this.currentVerses.length) {
            // عند الانتهاء من جميع الآيات، نتوقف
            this.currentVerseIndex = 0;
            this.shouldPlayBasmala = true;
            this.verseRepeatCounts = {};
            this.isRepeating = false;
            this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            return; // نتوقف هنا ولا نعيد التشغيل
        }

        try {
            // تشغيل البسملة قبل بداية السورة (عند الآية الأولى)
            if (index === 0 && this.shouldPlayBasmala && this.currentSurah.number !== 1 && this.currentSurah.number !== 9) {
                await this.playBasmala();
                this.shouldPlayBasmala = false;
            }

            this.currentVerseIndex = index;
            const verse = this.currentVerses[index];
            this.highlightVerse(index);
            
            if (!this.isRepeating) {
                this.verseRepeatCounts[index] = 0;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            await this.loadAudio(verse);
            
            if (this.audio.readyState >= 2) {
                await this.audio.play();
                this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                throw new Error('الصوت غير جاهز للتشغيل');
            }
        } catch (error) {
            console.error('خطأ في تشغيل الصوت:', error);
            alert('حدث خطأ في تشغيل الصوت. يرجى المحاولة مرة أخرى.');
            this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }
    
    initializeEventListeners() {
        this.playBtn.addEventListener('click', () => {
            this.shouldPlayBasmala = true;
            this.verseRepeatCounts = {}; // إعادة تعيين عداد التكرار عند بدء التشغيل
            this.playVerse(0);
        });
        
        this.reciterSelect.addEventListener('change', () => {
            // إعادة تحميل الآية الحالية عند تغيير القارئ
            if (this.currentVerseIndex >= 0 && this.currentVerses.length > 0) {
                this.playVerse(this.currentVerseIndex);
            }
        });
        
        this.prevBtn.addEventListener('click', () => {
            if (this.currentVerseIndex > 0) {
                this.verseRepeatCounts[this.currentVerseIndex] = 0; // إعادة تعيين عداد التكرار للآية الحالية
                this.playVerse(this.currentVerseIndex - 1);
            }
        });
        
        this.nextBtn.addEventListener('click', () => {
            if (this.currentVerseIndex < this.currentVerses.length - 1) {
                this.verseRepeatCounts[this.currentVerseIndex] = 0; // إعادة تعيين عداد التكرار للآية الحالية
                this.playVerse(this.currentVerseIndex + 1);
            }
        });
        
        this.playPauseBtn.addEventListener('click', () => {
            if (this.audio.paused) {
                this.audio.play();
                this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                this.audio.pause();
                this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        });
        
        this.progressContainer.addEventListener('click', (e) => {
            const rect = this.progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            this.audio.currentTime = pos * this.audio.duration;
        });
        
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        
        this.audio.addEventListener('ended', async () => {
            this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            
            const currentVerse = this.currentVerseIndex;
            const repeatCount = parseInt(this.repeatCount.value);
            
            // زيادة عداد التكرار للآية الحالية
            this.verseRepeatCounts[currentVerse] = (this.verseRepeatCounts[currentVerse] || 0) + 1;
            
            // تحديث عرض عداد التكرار
            const verseElement = this.versesContainer.querySelector(`.verse[data-index="${currentVerse}"]`);
            if (verseElement) {
                const repeatCountElement = verseElement.querySelector('.verse-repeat-count span');
                if (repeatCountElement) {
                    repeatCountElement.textContent = this.verseRepeatCounts[currentVerse];
                }
            }
            
            // إذا وصل عدد التكرار للعدد المطلوب، انتقل للآية التالية
            if (this.verseRepeatCounts[currentVerse] >= repeatCount) {
                this.isRepeating = false;
                this.verseRepeatCounts[currentVerse] = 0;
                
                // إذا كانت آخر آية، نتوقف
                if (currentVerse >= this.currentVerses.length - 1) {
                    this.currentVerseIndex = 0;
                    this.shouldPlayBasmala = true;
                    this.verseRepeatCounts = {};
                    this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                    return; // نتوقف هنا
                } else {
                    // الانتقال للآية التالية
                    await this.playVerse(currentVerse + 1);
                }
            } else {
                // تكرار الآية الحالية
                this.isRepeating = true;
                await this.playVerse(currentVerse);
            }
        });
        
        this.startVerse.addEventListener('change', () => {
            if (parseInt(this.startVerse.value) > parseInt(this.endVerse.value)) {
                this.endVerse.value = this.startVerse.value;
            }
            this.updateVerseDisplay();
        });
        
        this.endVerse.addEventListener('change', () => {
            if (parseInt(this.endVerse.value) < parseInt(this.startVerse.value)) {
                this.startVerse.value = this.endVerse.value;
            }
            this.updateVerseDisplay();
        });
    }
}

// تهيئة مشغل القرآن عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new QuranPlayer();
}); 