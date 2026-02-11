<template>
  <div class="page">
    <div class="container">
      <!-- 1. 대시보드 상단 그리드 -->
      <div class="dashboard-grid">
        <!-- 프로필 & 레벨 서브 그리드 -->
        <div class="dash-left">
          <section class="profile-card glass-panel">
            <div class="profile-inner">
              <img v-if="me?.profile_image" :src="getAbsoluteUrl(me.profile_image)" class="p-img" />
              <div v-else class="p-img ph"><User :size="24" /></div>
              <div class="p-info">
                <h1 class="p-nick">{{ me?.nickname || '정원사' }}님</h1>
                <p class="p-desc">오늘도 잔디를 가꿔볼까요? 🌱</p>
              </div>
            </div>
            <div class="p-stats">
              <div class="stat-item">
                <span class="stat-val">{{ reviews.length }}</span>
                <span class="stat-label">심은 잔디</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-val">{{ activityDaysCount }}</span>
                <span class="stat-label">활동 일수</span>
              </div>
            </div>
          </section>

          <section class="level-mini-card glass-panel highlight">
            <div class="level-top">
              <div class="icon-floating-wrap">
                <div class="lv-icon ph">{{ levelEmoji }}</div>
                <div class="lv-shadow"></div>
              </div>
              <div class="lv-info">
                <span class="lv-badge">Level {{ stats?.level || 1 }}</span>
                <h2 class="lv-title">{{ stats?.level_title || '성장하는 씨앗' }}</h2>
              </div>
            </div>
            <div class="lv-progress">
              <div class="prog-label">성장도 <strong>{{ Math.round((stats?.level_progress || 0) * 100) }}%</strong></div>
              <div class="prog-track">
                <div class="prog-fill" :style="{ width: `${(stats?.level_progress || 0) * 100}%` }">
                  <div class="prog-glow"></div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- 잔디북 섹션 -->
        <section class="grass-card glass-panel">
          <div class="card-head">
            <div class="head-left">
              <h3 class="card-title">나의 잔디북</h3>
              <div class="grass-type-tabs">
                <button 
                  :class="{ active: grassType === 'month' }" 
                  @click="grassType = 'month'"
                >월별</button>
                <button 
                  :class="{ active: grassType === 'year' }" 
                  @click="grassType = 'year'"
                >연별</button>
              </div>
            </div>
            <div class="grass-nav" v-if="grassType === 'month'">
              <button class="nav-btn small" @click="prevGrassMonth">◀</button>
              <button class="nav-btn small" @click="nextGrassMonth">▶</button>
            </div>
            <div class="grass-nav grass-year-select" v-else-if="grassType === 'year'">
              <select
                v-model.number="grassViewYear"
                class="year-select"
                @change="onGrassYearChange"
              >
                <option
                  v-for="y in grassAvailableYears"
                  :key="y"
                  :value="y"
                >{{ y }}년</option>
              </select>
            </div>
          </div>

          <div class="grass-wrap" :class="grassType">
            <!-- 1. 월별 뷰 (기존) -->
            <div class="jandi-container-monthly" v-if="grassType === 'month' && grassMonthlyCells.length">
              <div class="month-label-header">{{ grassMonthYearLabel }}</div>
              <div class="jandi-day-labels">
                <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
              </div>
              <div class="jandi-grid-monthly">
                <div 
                  v-for="(cell, idx) in grassMonthlyCells" 
                  :key="idx" 
                  class="jandi-cell" 
                  :class="[cell.isEmpty ? 'empty' : `lv-${cell.level}`]"
                >
                  <div v-if="!cell.isEmpty" class="jandi-tooltip">
                    <strong>{{ cell.date }}</strong><br/>
                    {{ cell.points }}개의 잔디를 심었어요
                  </div>
                </div>
              </div>
              <div class="yearly-legend">
                <span>Less</span>
                <div class="jandi-cell lv-0 small"></div>
                <div class="jandi-cell lv-1 small"></div>
                <div class="jandi-cell lv-2 small"></div>
                <div class="jandi-cell lv-3 small"></div>
                <div class="jandi-cell lv-4 small"></div>
                <span>More</span>
              </div>
            </div>

            <!-- 2. 연별 뷰 (신규) -->
            <div class="jandi-container-yearly" v-else-if="grassType === 'year' && grassYearlyWeeks.length">
              <div class="yearly-month-labels">
                <span v-for="m in monthNames" :key="m">{{ m }}</span>
              </div>
              <div class="yearly-grid-wrapper">
                <div class="yearly-columns">
                  <div v-for="(week, wIdx) in grassYearlyWeeks" :key="wIdx" class="yearly-column">
                    <div 
                      v-for="(day, dIdx) in week" 
                      :key="dIdx" 
                      class="jandi-cell"
                      :class="[day.isPadding ? 'pad' : `lv-${day.level}`]"
                    >
                      <div v-if="!day.isPadding" class="jandi-tooltip">
                        <strong>{{ day.date }}</strong><br/>
                        {{ day.points }}개의 잔디를 심었어요
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="yearly-legend">
                <span>Less</span>
                <div class="jandi-cell lv-0 small"></div>
                <div class="jandi-cell lv-1 small"></div>
                <div class="jandi-cell lv-2 small"></div>
                <div class="jandi-cell lv-3 small"></div>
                <div class="jandi-cell lv-4 small"></div>
                <span>More</span>
              </div>
            </div>

            <div v-else-if="loading" class="grass-placeholder animate-pulse">데이터 로딩 중...</div>
            <div v-else class="grass-placeholder">기록이 없습니다.</div>
          </div>
        </section>
      </div>

      <!-- 2. 탭 컨트롤 -->
      <div class="tab-control">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'review' }"
          @click="changeTab('review')"
        >
          📝 리뷰 목록
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'garden' }"
          @click="changeTab('garden')"
        >
          📅 월별 캘린더
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'bookmark' }"
          @click="changeTab('bookmark')"
        >
          📑 북마크
        </button>
      </div>

      <!-- 3. 하단 컨텐츠 -->
      <div v-show="activeTab === 'review'" class="section-content animate-in">
        <div v-if="loading" class="loading-state">기록을 불러오는 중...</div>
        <div v-else-if="reviews.length === 0" class="empty-state">아직 작성한 리뷰가 없습니다.</div>
        <div v-else>
          <div class="review-grid">
            <div v-for="rev in paginatedReviews" :key="rev.id" class="rev-item" @click="goReviewDetail(rev.id)">
              <div class="rev-cover-box">
                <img :src="rev.cover" alt="" />
                <div class="rev-spine"></div>
              </div>
              <div class="rev-main">
                <div class="rev-top">
                  <span class="rev-title">{{ rev.book_title }}</span>
                  <span class="rev-star">★ {{ rev.rating }}</span>
                </div>
                <p class="rev-txt">{{ rev.content }}</p>
                <span class="rev-date">{{ formatDate(rev.created_at) }}</span>
              </div>
            </div>
          </div>

          <!-- 리뷰 페이지네이션 -->
          <div v-if="reviewTotalPages > 1" class="review-pagination">
            <button 
              class="pg-btn" 
              :disabled="reviewCurrentPage === 1"
              @click="reviewCurrentPage--"
            > 이전 </button>
            <span class="pg-info">{{ reviewCurrentPage }} / {{ reviewTotalPages }}</span>
            <button 
              class="pg-btn" 
              :disabled="reviewCurrentPage === reviewTotalPages"
              @click="reviewCurrentPage++"
            > 다음 </button>
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'garden'" class="section-content animate-in">
        <div class="calendar-card glass-panel">
          <div class="calendar-header">
            <button class="nav-btn" @click="prevMonth">◀</button>
            <span class="month-title">{{ currentYear }}년 {{ currentMonth + 1 }}월</span>
            <button class="nav-btn" @click="nextMonth">▶</button>
          </div>
          <div class="calendar-grid">
            <div class="day-label sun">일</div> <div class="day-label">월</div> <div class="day-label">화</div>
            <div class="day-label">수</div> <div class="day-label">목</div> <div class="day-label">금</div>
            <div class="day-label sat">토</div>
            <div 
              v-for="(day, idx) in calendarDays" :key="idx" class="day-cell"
              :class="{ 'not-current': !day.isCurrentMonth, 'filled': day.featuredReview }"
              :style="day.featuredReview ? { backgroundImage: `url(${day.featuredReview.cover})` } : {}"
              @click="onDayClick(day)"
            >
              <span v-if="!day.featuredReview">{{ day.date }}</span>
              <div v-if="day.featuredReview" class="star-badge">★{{ day.featuredReview.rating }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'bookmark'" class="section-content animate-in">
        <div v-if="bookmarks.length === 0" class="empty-state">북마크한 책이 없습니다.</div>
        <div v-else class="bookmark-grid">
          <div 
            v-for="bm in bookmarks" 
            :key="bm.isbn13" 
            class="bm-card-full" 
            @click="goBookDetail(bm.isbn13)"
          >
            <div class="bm-cover-box">
              <img :src="bm.cover" alt="" />
              <div class="bm-spine"></div>
            </div>
            <div class="bm-info-box">
              <div class="bm-title-txt">{{ bm.title }}</div>
              <div class="bm-author-txt">{{ bm.author }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 날짜별 리뷰 선택 팝업 (모달) -->
    <div v-if="showDayModal" class="modal-overlay" @click.self="showDayModal = false">
      <div class="modal-content glass-panel">
        <header class="modal-header">
          <h3>{{ selectedDay?.fullDate }} 기록들</h3>
          <button class="close-btn" @click="showDayModal = false">✕</button>
        </header>
        <div class="modal-body">
          <p class="modal-desc">대표로 보여줄 책을 선택하세요.</p>
          <div class="day-review-list">
            <div 
              v-for="rev in selectedDayReviews" 
              :key="rev.id"
              class="day-review-item"
              :class="{ selected: selectedDay?.featuredReview?.id === rev.id }"
              @click="setFeaturedReview(rev)"
            >
              <img :src="rev.cover" class="day-mini-cover" />
              <div class="day-rev-info">
                 <div class="day-rev-title">{{ rev.book_title }}</div>
                 <div class="day-rev-rating">★ {{ rev.rating }}</div>
              </div>
              <div class="check-icon" v-if="selectedDay?.featuredReview?.id === rev.id">
                <Check :size="16" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { getMyReviews, getTodayReviews, setRepresentativeReview } from '@/api/review';
import { getMyGrass, getMyLevel, syncTodayGrass } from '@/api/grass';
import { getMyBookmarks } from '@/api/mypage';
import { User, Check, Heart, MessageCircle, Share2, MoreHorizontal, Send } from 'lucide-vue-next';
import { resolveProfileImage } from '@/utils/profileImage';

const router = useRouter();
const authStore = useAuthStore();

const me = computed(() => authStore.me);
const activeTab = ref('review');

const changeTab = (tab) => {
  activeTab.value = tab;
};
const loading = ref(true);
const stats = ref(null);
const reviews = ref([]);
const bookmarks = ref([]);

// 잔디 데이터
const grassValues = ref([]);
const grassMax = ref(3); 
const grassType = ref('month'); // 'month' | 'year'

const grassViewYear = ref(new Date().getFullYear());
const grassViewMonth = ref(new Date().getMonth());
/** 연도 select: 2025년, 2026년만 표시 */
const grassAvailableYears = computed(() => [2026, 2025]); 

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const levelIcons = {
  seed: "🌱",
  sprout: "🌿",
  grass: "🍀",
  flower: "🌸",
  tree: "🌳",
  forest: "🌲"
};

const levelEmoji = computed(() => {
  const icon = stats.value?.level_icon;
  return levelIcons[icon] || "🌱";
});

const grassMonthYearLabel = computed(() => {
  return `${grassViewYear.value}년 ${grassViewMonth.value + 1}월`;
});

const activityDaysCount = computed(() => {
  return grassValues.value.filter(v => v.points > 0).length;
});

const getLevel = (points) => {
  if (points >= 3) return 4;
  if (points >= 2) return 3;
  if (points >= 1) return 2;
  if (points > 0) return 1;
  return 0;
};

const grassYearlyWeeks = computed(() => {
  if (grassValues.value.length === 0) return [];
  
  // 연도 시작일부터 종료일까지 매핑 (기본적으로 백엔드에서 1년치 내려옴)
  // 프론트엔드에서도 안전하게 1월 1일부터 12월 31일까지 생성
  const year = grassViewYear.value;
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  const days = [];
  let curr = new Date(startDate);
  while (curr <= endDate) {
    const dStr = curr.toISOString().split('T')[0];
    const found = grassValues.value.find(v => v.date === dStr);
    days.push({
        date: dStr,
        points: found ? found.points : 0,
        level: found ? getLevel(found.points) : 0,
        dayOfWeek: curr.getDay()
    });
    curr.setDate(curr.getDate() + 1);
  }

  // 7일씩 주(Week) 단위로 묶기 (세로 방향)
  const weeks = [];
  let currentWeek = [];
  
  // 요일 맞춤을 위해 첫 주 패딩
  for (let i = 0; i < days[0].dayOfWeek; i++) {
    currentWeek.push({ isPadding: true });
  }

  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ isPadding: true });
    }
    weeks.push(currentWeek);
  }
  
  return weeks;
});

const grassMonthlyCells = computed(() => {
  const firstDay = new Date(grassViewYear.value, grassViewMonth.value, 1).getDay(); 
  const daysInMonth = new Date(grassViewYear.value, grassViewMonth.value + 1, 0).getDate();
  const cells = [];
  
  for (let i = 0; i < firstDay; i++) {
    cells.push({ isEmpty: true });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${grassViewYear.value}-${String(grassViewMonth.value + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const found = grassValues.value.find(v => v.date === dateStr);
    const points = found ? (found.points || 0) : 0;
    const level = getLevel(points);
    
    cells.push({
      date: dateStr,
      points,
      level,
      isEmpty: false
    });
  }
  return cells;
});

const prevGrassMonth = () => {
  if (grassViewMonth.value === 0) {
    grassViewMonth.value = 11;
    grassViewYear.value--;
  } else {
    grassViewMonth.value--;
  }
};

const nextGrassMonth = () => {
  if (grassViewMonth.value === 11) {
    grassViewMonth.value = 0;
    grassViewYear.value++;
  } else {
    grassViewMonth.value++;
  }
};

/** 연도 선택 변경 시 해당 연도 잔디 데이터 로드 */
const onGrassYearChange = async () => {
  loading.value = true;
  try {
    const grassRes = await getMyGrass({ year: grassViewYear.value });
    grassMax.value = grassRes.data?.cap ?? 3;
    grassValues.value = (grassRes.data?.values || []).map(v => ({
      date: v.date,
      points: v.count
    }));
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

watch(grassType, (newVal) => {
  if (newVal === 'year') {
    if (![2025, 2026].includes(grassViewYear.value)) grassViewYear.value = 2026;
    onGrassYearChange();
  }
});

// 캘린더 관련
const now = new Date();
const currentYear = ref(now.getFullYear());
const currentMonth = ref(now.getMonth());

// 팝업
const showDayModal = ref(false);
const selectedDay = ref(null);

const sortedReviews = computed(() => {
  return [...reviews.value].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
});

// 리뷰 페이지네이션 관련
const reviewCurrentPage = ref(1);
const reviewPageSize = 9;
const reviewTotalPages = computed(() => Math.ceil(sortedReviews.value.length / reviewPageSize));

const paginatedReviews = computed(() => {
  const start = (reviewCurrentPage.value - 1) * reviewPageSize;
  const end = start + reviewPageSize;
  return sortedReviews.value.slice(start, end);
});

const syncActivity = async () => {
  try {
    const res = await getTodayReviews();
    if (res.data && res.data.length > 0) {
      await syncTodayGrass();
    }
  } catch (err) {
    console.error("Sync failed", err);
  }
};

onMounted(async () => {
  if (!authStore.access) {
     router.push('/login');
     return;
  }
  
  try {
    loading.value = true;
    
    // 1. 기초 데이터 로드 (프로필, 전체 리뷰, 북마크 등)
    const [levelRes, userRes, reviewsRes, bookmarkRes] = await Promise.all([
      getMyLevel(),
      authStore.fetchMe(),
      getMyReviews(),
      getMyBookmarks()
    ]);
    
    stats.value = levelRes.data;
    reviews.value = reviewsRes.data || [];
    bookmarks.value = bookmarkRes.data || [];

    // 2. 오늘의 활동 잔디 동기화 (비동기 처리)
    await syncActivity();

    // 3. 잔디 최종 데이터 로드
    const grassRes = await getMyGrass({ year: grassViewYear.value });
    const maxVal = grassRes.data?.cap ?? 3;
    grassMax.value = maxVal;
    grassValues.value = (grassRes.data?.values || []).map(v => ({
      date: v.date,
      points: v.count
    }));
    
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

const getAbsoluteUrl = (url) => resolveProfileImage(url);
const getProfileImage = (url) => resolveProfileImage(url);

const goBookDetail = (isbn13) => {
  if (!isbn13) return;
  router.push(`/books/${isbn13}`);
};

const goReviewDetail = (id) => {
  router.push(`/reviews/${id}`);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

/** Calendar Logic **/
const calendarDays = computed(() => {
  const days = [];
  const firstDay = new Date(currentYear.value, currentMonth.value, 1);
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0);
  
  // Previous month padding
  const startDayOfWeek = firstDay.getDay(); 
  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
     days.push({
       date: prevMonthLastDay - i,
       isCurrentMonth: false,
       month: currentMonth.value - 1,
       year: currentYear.value
     });
  }
  
  // Current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
     const dateStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
     const dayReviews = reviews.value.filter(r => r.created_at.startsWith(dateStr));
     
     let featured = null;
     if (dayReviews.length > 0) {
        // 백엔드에서 설정된 대표 리뷰가 있다면 우선, 없으면 마지막 리뷰
        featured = dayReviews.find(r => r.is_representative) || dayReviews[dayReviews.length - 1];
     }

     days.push({
       date: i,
       isCurrentMonth: true,
       fullDate: dateStr,
       featuredReview: featured,
       reviews: dayReviews
     });
  }
  
  // Next month padding
  const totalCells = 42;
  const remainingCells = totalCells - days.length;
  for (let i = 1; i <= remainingCells; i++) {
     days.push({
       date: i,
       isCurrentMonth: false,
       month: currentMonth.value + 1,
       year: currentYear.value
     });
  }
  
  return days;
});

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

const onDayClick = (day) => {
  if (day.featuredReview) {
    selectedDay.value = day;
    showDayModal.value = true;
  }
};

const selectedDayReviews = computed(() => {
  return selectedDay.value?.reviews || [];
});

const setFeaturedReview = async (rev) => {
  if (!selectedDay.value) return;
  try {
    await setRepresentativeReview(rev.id);
    // 선택 후 최신 데이터 다시 로드하여 캘린더 반영
    const res = await getMyReviews();
    reviews.value = res.data || [];
    showDayModal.value = false;
  } catch (err) {
    console.error("대표 리뷰 설정 실패:", err);
    alert("대표 리뷰 설정에 실패했습니다.");
  }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f8fafb;
  padding: 40px 0 100px;
}
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}

/* 공통 패널 */
.glass-panel { background: white; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); border: 1px solid white; }

/* 1. 대시보드 그리드 */
.dashboard-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

/* 왼쪽 열: 프로필 + 레벨 */
.dash-left {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 프로필 카드 */
.profile-card {
  padding: 24px;
}
.profile-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.p-img {
  width: 56px; height: 56px; border-radius: 50%; object-fit: cover;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
.p-img.ph {
  background: #f0fdf4; display: flex; align-items: center; justify-content: center; color: #00d15b;
}
.p-nick { font-size: 1.25rem; font-weight: 850; margin: 0; color: #191f28; }
.p-desc { font-size: 0.85rem; color: #8b95a1; margin: 4px 0 0; }

.p-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 16px;
  border-top: 1px solid #f2f4f6;
}
.stat-item { text-align: center; display: flex; flex-direction: column; }
.stat-val { font-size: 1.15rem; font-weight: 800; color: #191f28; }
.stat-label { font-size: 0.75rem; color: #8b95a1; margin-top: 4px; }
.stat-divider { width: 1px; background: #f2f4f6; }

/* 레벨 카드 */
.level-mini-card.highlight {
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
  border: 1px solid rgba(0,209,91,0.15);
}
.level-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  text-align: center;
}
.icon-floating-wrap { position: relative; width: 100px; display: flex; justify-content: center; }
.lv-icon { 
  font-size: 80px;
  line-height: 1;
  display: block;
  animation: float 3s ease-in-out infinite;
}
.lv-icon.ph { 
  display: flex; 
  align-items: center; 
  justify-content: center;
  font-size: 80px;
}
.lv-shadow {
  width: 50px; height: 6px; background: rgba(0,0,0,0.05); border-radius: 50%;
  position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%);
  animation: shadow-pulse 3s ease-in-out infinite;
}
.lv-badge { 
  font-size: 0.75rem; font-weight: 800; color: #00d15b; 
  background: rgba(0,209,91,0.1); padding: 2px 8px; border-radius: 99px;
}
.lv-title { font-size: 1.1rem; font-weight: 850; margin: 6px 0 0; color: #191f28; }

.lv-progress { width: 100%; }
.prog-label { font-size: 0.85rem; color: #4e5968; margin-bottom: 8px; }
.prog-label strong { color: #00d15b; }
.prog-track { height: 8px; background: #e5e8eb; border-radius: 99px; overflow: hidden; }
.prog-fill { 
  height: 100%; background: linear-gradient(90deg, #00d15b, #00ff6f); 
  border-radius: 99px; position: relative; transition: width 1s ease-out;
}
.prog-glow {
  position: absolute; top: 0; height: 100%; width: 20px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shimmer 1.5s infinite;
}

/* 잔디 카드 */
.grass-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
}
.card-head { 
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px; 
}
.card-title { font-size: 1.2rem; font-weight: 850; color: #191f28; margin: 0; }
.card-sub { font-size: 0.85rem; color: #8b95a1; }

.grass-nav { display: flex; gap: 8px; }
.nav-btn.small {
  width: 28px; height: 28px; font-size: 0.8rem;
  padding: 0; display: flex; align-items: center; justify-content: center;
}

.grass-wrap { 
  flex: 1; display: flex; align-items: center; justify-content: center; 
}

.head-left { display: flex; align-items: center; gap: 16px; }

/* 잔디 타입 탭 */
.grass-type-tabs {
  display: flex; gap: 4px; background: #f2f4f6; padding: 3px; border-radius: 10px;
}
.grass-type-tabs button {
  padding: 5px 12px; border: none; background: transparent; border-radius: 8px;
  font-size: 0.8rem; font-weight: 700; color: #8b95a1; cursor: pointer; transition: 0.2s;
}
.grass-type-tabs button.active { background: white; color: #191f28; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }

.grass-nav { display: flex; gap: 8px; align-items: center; }
.grass-year-select .year-select {
  padding: 6px 12px; border-radius: 8px; border: 1px solid #e5e8eb;
  font-size: 0.9rem; font-weight: 600; color: #191f28; background: white;
  cursor: pointer; min-width: 90px;
}
.nav-btn.small {
  width: 28px; height: 28px; font-size: 0.8rem;
  padding: 0; display: flex; align-items: center; justify-content: center;
}

.grass-wrap { 
  flex: 1; display: flex; align-items: center; justify-content: center; 
  padding: 10px 0;
}
.grass-wrap.year { justify-content: flex-start; overflow-x: auto; padding-bottom: 20px; }

/* 월별 스타일 */
.jandi-container-monthly {
  width: 100%; max-width: 280px;
}
.month-label-header { text-align: center; font-weight: 850; margin-bottom: 12px; font-size: 0.95rem; }
.jandi-day-labels {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 8px; text-align: center;
}
.jandi-day-labels span { font-size: 0.7rem; font-weight: 700; color: #adb5bd; }
.jandi-grid-monthly { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }

/* 연별 스타일 */
.jandi-container-yearly {
  display: flex; flex-direction: column; width: 100%; min-width: 800px; padding: 0 10px;
}
.yearly-month-labels {
  display: flex; margin-bottom: 8px; padding-left: 30px;
}
.yearly-month-labels span { flex: 1; font-size: 0.75rem; color: #adb5bd; font-weight: 700; }

.yearly-grid-wrapper { display: flex; gap: 0; }
.yearly-columns { display: flex; gap: 3px; flex: 1; }
.yearly-column { display: flex; flex-direction: column; gap: 3px; flex-shrink: 0; }

/* 스크롤바 커스텀 */
.grass-wrap.year::-webkit-scrollbar { height: 6px; }
.grass-wrap.year::-webkit-scrollbar-track { background: #f2f4f6; border-radius: 3px; }
.grass-wrap.year::-webkit-scrollbar-thumb { background: #e5e8eb; border-radius: 3px; }
.grass-wrap.year::-webkit-scrollbar-thumb:hover { background: #adb5bd; }

.yearly-legend {
  display: flex; align-items: center; gap: 6px; margin-top: 16px;
  justify-content: center; font-size: 0.75rem; color: #adb5bd; font-weight: 700;
}
.jandi-cell.small { width: 12px; height: 12px; border-radius: 3px; }

/* 공통 셀 */
.jandi-cell {
  position: relative; width: 100%; aspect-ratio: 1;
  background: rgba(0,0,0,0.05); border-radius: 2px; transition: 0.2s;
}
.jandi-container-yearly .jandi-cell { width: 12px; height: 12px; }
.jandi-cell.empty, .jandi-cell.pad { background: transparent; cursor: default; }
.jandi-cell:not(.empty):not(.pad):hover { transform: scale(1.15); z-index: 10; }

.jandi-tooltip {
  visibility: hidden; opacity: 0; position: absolute; bottom: 160%; left: 50%;
  transform: translateX(-50%) translateY(10px); background: #191f28; color: white;
  padding: 8px 12px; border-radius: 8px; font-size: 0.7rem; white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  pointer-events: none; z-index: 20;
}
.jandi-tooltip::after {
  content: ""; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
  border: 6px solid transparent; border-top-color: #191f28;
}
.jandi-cell:hover .jandi-tooltip { visibility: visible; opacity: 1; transform: translateX(-50%) translateY(0); }

.lv-0 { background: rgba(0,0,0,0.05); }
.lv-1 { background: #e0fde0; }
.lv-2 { background: #d1f7c4; }
.lv-3 { background: #66e095; }
.lv-4 { background: #00d15b; box-shadow: 0 0 6px rgba(0,209,91,0.3); }

.grass-placeholder { color: #b0b8c1; font-weight: 600; font-size: 0.95rem; }

/* 2. 탭 컨트롤 */
.tab-control {
  display: flex; gap: 12px; margin-bottom: 24px; 
  padding: 6px; background: #eee; border-radius: 16px; width: fit-content;
}
.tab-btn {
  padding: 10px 24px; border: none; border-radius: 12px; font-weight: 800; color: #8b95a1;
  background: transparent; cursor: pointer; transition: 0.2s; font-size: 0.95rem;
}
.tab-btn.active { background: white; color: #191f28; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }

/* 3. 리스트 영역 */
.animate-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.loading-state, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #8b95a1;
  font-weight: 600;
}

.review-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;
}
.rev-item {
  background: white; padding: 16px; border-radius: 20px; display: flex; gap: 16px;
  border: 1px solid rgba(0,0,0,0.03); cursor: pointer; transition: 0.2s;
}
.rev-item:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }

.rev-cover-box { 
  position: relative; width: 60px; height: 90px; flex-shrink: 0; border-radius: 2px 6px 6px 2px;
  overflow: hidden; box-shadow: 3px 5px 12px rgba(0,0,0,0.1);
}
.rev-cover-box img { width: 100%; height: 100%; object-fit: cover; }
.rev-spine {
  position: absolute; top: 0; left: 0; bottom: 0; width: 4px;
  background: linear-gradient(to right, rgba(0,0,0,0.2), transparent);
}

.rev-main { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.rev-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.rev-title { font-weight: 850; font-size: 0.95rem; color: #191f28; line-clamp: 1; -webkit-line-clamp: 1; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; }
.rev-star { color: #FFD700; font-size: 0.85rem; font-weight: 800; }
.rev-txt { font-size: 0.85rem; color: #4e5968; line-height: 1.5; margin-bottom: 8px; line-clamp: 2; -webkit-line-clamp: 2; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; }
.rev-date { font-size: 0.75rem; color: #adb5bd; }

/* 애니메이션 */
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes shadow-pulse { 0%, 100% { transform: scale(1); opacity: 0.2; } 50% { transform: scale(1.3); opacity: 0.1; } }
@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }

@media (max-width: 1024px) {
  .dashboard-grid { grid-template-columns: 1fr; }
  .grass-wrap { justify-content: flex-start; }
  .alternate-layout { grid-template-columns: 1fr; }
}

/* 기존 나머지 디자인 유지 */
.month-title { font-size: 1.2rem; font-weight: 850; }
.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 0 10px; }
.nav-btn { background: none; border: none; cursor: pointer; color: #8b95a1; font-size: 1.1rem; width: 36px; height: 36px; border-radius: 50%; }
.nav-btn:hover { background: #f2f4f6; color: #191f28; }

/* Bookmark Tab Styling */
.bookmark-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
}

@media (max-width: 1100px) {
  .bookmark-grid { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 768px) {
  .bookmark-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 480px) {
  .bookmark-grid { grid-template-columns: repeat(2, 1fr); }
}

.bm-card-full {
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition: 0.2s;
}

.bm-card-full:hover {
  transform: translateY(-5px);
}

.bm-cover-box {
  position: relative;
  aspect-ratio: 2/3;
  border-radius: 4px 10px 10px 4px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.bm-cover-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bm-spine {
  position: absolute;
  top: 0; left: 0; bottom: 0; width: 6px;
  background: linear-gradient(to right, rgba(0,0,0,0.3), transparent);
}

.bm-info-box {
  text-align: center;
  margin-top: 8px;
}

.bm-title-txt {
  font-size: 0.9rem;
  font-weight: 800;
  color: #191f28;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
  height: 2.6em; /* 1.3 * 2 = 2.6em Fixed height for alignment */
  margin-bottom: 4px;
}

.bm-author-txt {
  font-size: 0.75rem;
  color: #8b95a1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  height: 1.2em; /* Fixed height */
}

.calendar-card {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px 24px;
}
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.day-label { text-align: center; color: #8b95a1; font-weight: 700; font-size: 0.8rem; padding-bottom: 12px; }
.day-label.sun { color: #ff6b6b; }
.day-label.sat { color: #4d96ff; }
.day-cell { aspect-ratio: 1/1.3; border-radius: 8px; background: #f2f4f6; display: flex; align-items: center; justify-content: center; color: #adb5bd; font-weight: 700; position: relative; cursor: pointer; font-size: 0.85rem; }
.day-cell.not-current { opacity: 0.3; pointer-events: none; }
.day-cell.filled { background-size: cover; background-position: center; color: transparent; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.star-badge { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: #ffd700; font-size: 0.65rem; padding: 2px 5px; border-radius: 6px; backdrop-filter: blur(2px); font-weight: 800; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { width: 90%; max-width: 400px; padding: 24px; background: white; border-radius: 24px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.modal-header h3 { margin: 0; font-weight: 850; }
.close-btn { background: none; border: none; cursor: pointer; font-size: 1.2rem; color: #8b95a1; }
.modal-desc { font-size: 0.9rem; color: #6b7684; margin-bottom: 20px; }
.day-review-list { display: flex; flex-direction: column; gap: 10px; }
.day-review-item { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 14px; background: #f9fafb; cursor: pointer; border: 2px solid transparent; }
.day-review-item.selected { border-color: #00d15b; background: white; }
.day-mini-cover { width: 40px; height: 60px; border-radius: 4px; object-fit: cover; }
.day-rev-info { flex: 1; }
.day-rev-title { font-weight: 800; font-size: 0.9rem; }
.day-rev-rating { color: #FFD700; font-size: 0.8rem; font-weight: 800; }
.check-icon { color: #00d15b; }
/* Review Pagination Specific Styles */
.review-pagination {
  margin-top: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}
.pg-btn {
  padding: 8px 16px;
  border-radius: 8px;
  background: white;
  border: 1px solid #e5e8eb;
  color: #4e5968;
  font-weight: 700;
  font-size: 0.9rem;
  transition: 0.2s;
  cursor: pointer;
}
.pg-btn:hover:not(:disabled) {
  background: #f2f4f6;
  border-color: #b0b8c1;
}
.pg-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pg-info {
  font-size: 0.95rem;
  font-weight: 700;
  color: #191f28;
}
</style>
