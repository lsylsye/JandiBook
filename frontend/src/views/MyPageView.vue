<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getMyProfile, getUserProfile, updateMyProfile, toggleFollow, getFollowers, getFollowing } from "@/api/mypage";
import { useMypageStore } from "@/stores/mypage.store";

const DEFAULT_PROFILE_IMAGE = "https://jandibook.up.railway.app/media/profiles/default_profile.jpg";
function safeProfileImage(url) {
  if (!url || String(url).includes("placeholder.com") || String(url).includes("via.placeholder")) return DEFAULT_PROFILE_IMAGE;
  return url;
}

const mypageStore = useMypageStore();

const router = useRouter();
const route = useRoute();

const isEditModalOpen = ref(false);
const isFollowModalOpen = ref(false);
const followModalType = ref(""); // "followers" or "following"

const profile = ref(null);
const isLoading = ref(true);
const isMe = ref(true);

// 수정 폼 데이터
const editForm = ref({
  nickname: "",
  bio: "",
  favorite_country: "",
  other_country: "",
  favorite_genre: "",
  profile_image: null,
});

// 팔로우 리스트
const followList = ref([]);

// 내 활동 데이터 (Store 연동)
const myPosts = computed(() => mypageStore.posts || []);
const myComments = computed(() => mypageStore.comments || []);
const activeTab = ref("posts"); // "posts" or "comments"

const levelIcon = computed(() => {
  const icons = {
    seed: "🌱",
    sprout: "🌿",
    grass: "🍀",
    flower: "🌸",
    tree: "🌳",
    forest: "🌲"
  };
  return icons[profile.value?.level_icon] || "🌱";
});

const levelProgress = computed(() => {
  return Math.round((profile.value?.level_progress || 0) * 100);
});

// Pagination for My Activity
const postsPage = ref(1);
const commentsPage = ref(1);
const pageSize = 6;

const paginatedPosts = computed(() => {
  const start = (postsPage.value - 1) * pageSize;
  return myPosts.value.slice(start, start + pageSize);
});

const paginatedComments = computed(() => {
  const start = (commentsPage.value - 1) * pageSize;
  return myComments.value.slice(start, start + pageSize);
});

const totalPostsPages = computed(() => Math.ceil(myPosts.value.length / pageSize) || 1);
const totalCommentsPages = computed(() => Math.ceil(myComments.value.length / pageSize) || 1);

watch(activeTab, () => {
  postsPage.value = 1;
  commentsPage.value = 1;
});

onMounted(async () => {
  await loadProfile();
  if (isMe.value && typeof mypageStore.fetchMyActivity === 'function') {
    await mypageStore.fetchMyActivity();
  }
});

watch(
  () => route.params.id,
  async () => {
    await loadProfile();
    if (isMe.value && typeof mypageStore.fetchMyActivity === 'function') {
      await mypageStore.fetchMyActivity();
    }
  }
);

async function loadProfile() {
  isLoading.value = true;
  try {
    const userId = route.params.id;
    if (userId) {
      // 다른 사용자 프로필
      const res = await getUserProfile(userId);
      profile.value = res.data;
      isMe.value = res.data.is_me;
    } else {
      // 내 프로필
      const res = await getMyProfile();
      profile.value = res.data;
      isMe.value = true;
    }
  } catch (err) {
    console.error("Failed to load profile", err);
  } finally {
    isLoading.value = false;
  }
}

function openEditModal() {
  editForm.value = {
    nickname: profile.value.nickname,
    bio: profile.value.bio || "",
    favorite_country: profile.value.favorite_country || "",
    other_country: profile.value.other_country || "",
    favorite_genre: profile.value.favorite_genre || "",
    profile_image: null,
  };
  isEditModalOpen.value = true;
}

function closeEditModal() {
  isEditModalOpen.value = false;
}

async function saveProfile() {
  try {
    const formData = new FormData();
    formData.append("nickname", editForm.value.nickname);
    formData.append("bio", editForm.value.bio);
    if (editForm.value.favorite_country) {
      formData.append("favorite_country", editForm.value.favorite_country);
    }
    if (editForm.value.favorite_country === "OTHER") {
      formData.append("other_country", editForm.value.other_country);
    }
    if (editForm.value.favorite_genre) {
      formData.append("favorite_genre", editForm.value.favorite_genre);
    }
    if (editForm.value.profile_image) {
      formData.append("profile_image", editForm.value.profile_image);
    }

    await updateMyProfile(formData);
    await loadProfile();
    closeEditModal();
    alert("프로필이 업데이트되었습니다!");
  } catch (err) {
    console.error("Failed to update profile", err);
    alert("프로필 업데이트에 실패했습니다.");
  }
}

function handleImageChange(e) {
  const file = e.target.files[0];
  if (file) {
    editForm.value.profile_image = file;
  }
}

async function openFollowModal(type) {
  followModalType.value = type;
  isFollowModalOpen.value = true;
  
  try {
    const userId = route.params.id || null;
    if (type === "followers") {
      const res = await getFollowers(userId);
      followList.value = res.data;
    } else {
      const res = await getFollowing(userId);
      followList.value = res.data;
    }
  } catch (err) {
    console.error("Failed to load follow list", err);
  }
}

function closeFollowModal() {
  isFollowModalOpen.value = false;
  followList.value = [];
}

async function handleFollowToggle(userId) {
  try {
    await toggleFollow(userId);
    // 리스트 다시 로드
    if (followModalType.value === "followers") {
      const res = await getFollowers(route.params.id || null);
      followList.value = res.data;
    } else {
      const res = await getFollowing(route.params.id || null);
      followList.value = res.data;
    }
    // 프로필도 다시 로드 (팔로워/팔로잉 수 업데이트)
    await loadProfile();
  } catch (err) {
    console.error("Failed to toggle follow", err);
  }
}

async function handleProfileFollowToggle() {
  try {
    await toggleFollow(profile.value.id);
    await loadProfile();
  } catch (err) {
    console.error("Failed to toggle follow", err);
  }
}

async function loadMyActivity() {
  if (typeof mypageStore.fetchMyActivity === 'function') {
    await mypageStore.fetchMyActivity();
  }
}

function goToUserProfile(userId) {
  router.push(`/profile/${userId}`);
  closeFollowModal();
}
</script>

<template>
  <div class="mypage-container">
    <div v-if="isLoading" class="loading">로딩 중...</div>
    
    <div v-else class="container">
      <!-- 상단 그리드: 프로필 + 통계 -->
      <div class="top-grid">
        <!-- 왼쪽: 프로필 정보 -->
        <div class="card profile-card">
          <div class="profile-compact">
            <img 
              :src="safeProfileImage(profile.profile_image)" 
              class="avatar" 
              :alt="profile.nickname" 
            />
            <div class="profile-info">
              <div class="user-name">
                {{ profile.nickname }}
                <span class="level-badge">
                  {{ levelIcon }} Lv.{{ profile.level }}
                </span>
              </div>
              <div class="user-email">{{ profile.email }}</div>
            </div>

            <!-- 프로필 액션 버튼 (우측 가운데) -->
            <div class="profile-compact-actions">
              <button 
                v-if="!isMe" 
                class="btn-follow"
                :class="{ following: profile.is_following }"
                @click="handleProfileFollowToggle"
              >
                {{ profile.is_following ? '언팔로우' : '팔로우' }}
              </button>
              <button v-if="isMe" class="btn-edit" @click="openEditModal">
                ⚙️ 수정
              </button>
            </div>
          </div>

          <div class="intro-box">
            {{ profile.bio || "소개글이 없습니다." }}
          </div>

          <div class="tag-group">
            <span v-if="profile.favorite_country" class="tag-badge tag-country">
              🌍 {{ profile.favorite_country_display }}
            </span>
            <span v-if="profile.favorite_genre" class="tag-badge">
              📚 {{ profile.favorite_genre_display }}
            </span>
          </div>
        </div>

        <!-- 오른쪽: 통계 + 레벨 -->
        <div class="stats-column">
          <!-- 팔로워/팔로잉 카드 -->
          <div class="card stats-card">
            <div class="follow-stats">
              <div class="stat-item" @click="openFollowModal('followers')">
                <div class="stat-number">{{ profile.followers_count }}</div>
                <div class="stat-label">팔로워</div>
              </div>
              <div class="stat-item" @click="openFollowModal('following')">
                <div class="stat-number">{{ profile.following_count }}</div>
                <div class="stat-label">팔로잉</div>
              </div>
            </div>
          </div>

          <!-- 레벨 카드 -->
          <div class="card level-card">
            <div class="lv-info">
              <span>{{ levelIcon }} {{ profile.level_title }}</span>
              <span>{{ levelProgress }}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-bar" :style="{ width: levelProgress + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 내 서재 바로가기 -->
      <router-link :to="{ name: 'mylibrary' }" class="link-banner">
        <div class="banner-text">
          <h3>🏡 나의 서재</h3>
          <p>내가 심은 잔디들을 확인해보세요</p>
        </div>
        <div style="font-size: 1.3rem">➔</div>
      </router-link>

      <!-- 내 활동 (내 프로필일 때만) -->
      <div v-if="isMe" class="card activity-card">
        <div class="activity-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'posts' }"
            @click="activeTab = 'posts'; loadMyActivity()"
          >
            내가 쓴 글
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'comments' }"
            @click="activeTab = 'comments'; loadMyActivity()"
          >
            내가 쓴 댓글
          </button>
        </div>

        <div class="activity-content">
          <!-- 내가 쓴 글 -->
          <div v-if="activeTab === 'posts'" class="activity-list">
            <div v-if="!myPosts || myPosts.length === 0" class="empty-state">
              작성한 글이 없습니다.
            </div>
            <div 
              v-for="post in paginatedPosts" 
              :key="post.detail_url"
              class="activity-item compact-item"
              @click="router.push(post.detail_url)"
            >
              <div class="activity-title">{{ post.title }}</div>
              <div class="activity-footer">
                <div class="activity-sub">
                  {{ post.board_name }}<span v-if="post.prefix_name"> &gt; {{ post.prefix_name }}</span>
                </div>
                <div class="activity-date">{{ new Date(post.created_at).toLocaleDateString() }}</div>
              </div>
            </div>

            <!-- Posts Pagination -->
            <div v-if="totalPostsPages > 1" class="mini-pagination">
              <button :disabled="postsPage === 1" @click="postsPage--">이전</button>
              <span>{{ postsPage }} / {{ totalPostsPages }}</span>
              <button :disabled="postsPage === totalPostsPages" @click="postsPage++">다음</button>
            </div>
          </div>

          <!-- 내가 쓴 댓글 -->
          <div v-if="activeTab === 'comments'" class="activity-list">
            <div v-if="!myComments || myComments.length === 0" class="empty-state">
              작성한 댓글이 없습니다.
            </div>
            <div 
              v-for="comment in paginatedComments" 
              :key="comment.comment_id"
              class="activity-item compact-item"
              @click="router.push(comment.detail_url)"
            >
              <div class="activity-title">{{ comment.post_title }}</div>
              <div class="activity-footer">
                <div class="activity-content-text">{{ comment.content }}</div>
                <div class="activity-date">{{ new Date(comment.created_at).toLocaleDateString() }}</div>
              </div>
            </div>

            <!-- Comments Pagination -->
            <div v-if="totalCommentsPages > 1" class="mini-pagination">
              <button :disabled="commentsPage === 1" @click="commentsPage--">이전</button>
              <span>{{ commentsPage }} / {{ totalCommentsPages }}</span>
              <button :disabled="commentsPage === totalCommentsPages" @click="commentsPage++">다음</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 수정 모달 -->
    <div class="modal-overlay" :class="{ active: isEditModalOpen }">
      <div class="modal-content">
        <h3 class="modal-title">프로필 수정</h3>

        <label class="form-label">프로필 이미지</label>
        <input type="file" accept="image/*" @change="handleImageChange" class="input-field" />

        <label class="form-label">닉네임</label>
        <input type="text" class="input-field" v-model="editForm.nickname" />

        <label class="form-label">소개글</label>
        <textarea class="input-field" v-model="editForm.bio"></textarea>

        <label class="form-label">좋아하는 나라</label>
        <select class="input-field" v-model="editForm.favorite_country">
          <option value="">선택 안함</option>
          <option value="KR">🇰🇷 대한민국</option>
          <option value="JP">🇯🇵 일본</option>
          <option value="CN">🇨🇳 중화권</option>
          <option value="EN">🇺🇸 영미권</option>
          <option value="OTHER">🌍 기타</option>
        </select>

        <div v-if="editForm.favorite_country === 'OTHER'" style="margin-top: 10px;">
          <label class="form-label">기타 나라(직접 입력)</label>
          <input type="text" class="input-field" v-model="editForm.other_country" placeholder="예) 스페인, 러시아, 브라질…" />
        </div>

        <label class="form-label">좋아하는 장르</label>
        <select class="input-field" v-model="editForm.favorite_genre">
          <option value="">선택 안함</option>
          <option value="novel_poem_drama">📖 소설/시/희곡</option>
          <option value="business">💰 경제/경영</option>
          <option value="self_help">🔥 자기계발</option>
          <option value="humanities">🧠 인문/철학</option>
          <option value="hobby_practical">🧩 취미/실용</option>
          <option value="comic_ebook">🧿 만화/eBook</option>
          <option value="science">🔭 과학</option>
        </select>

        <div class="btn-row">
          <button class="btn-cancel" @click="closeEditModal">취소</button>
          <button class="btn-confirm" @click="saveProfile">저장하기</button>
        </div>
      </div>
    </div>

    <!-- 팔로워/팔로잉 모달 -->
    <div class="modal-overlay" :class="{ active: isFollowModalOpen }">
      <div class="modal-content">
        <h3 class="modal-title">
          {{ followModalType === 'followers' ? '팔로워' : '팔로잉' }}
        </h3>

        <div class="follow-list">
          <div v-if="followList.length === 0" class="empty-state">
            {{ followModalType === 'followers' ? '팔로워가' : '팔로잉이' }} 없습니다.
          </div>
          <div 
            v-for="user in followList" 
            :key="user.id"
            class="follow-item"
          >
            <img 
              :src="safeProfileImage(user.profile_image)" 
              class="follow-avatar"
              @click="goToUserProfile(user.id)"
            />
            <div class="follow-info" @click="goToUserProfile(user.id)">
              <div class="follow-nickname">{{ user.nickname }}</div>
              <div class="follow-username">@{{ user.username }}</div>
            </div>
            <button 
              v-if="user.id !== profile.id"
              class="btn-follow-small"
              :class="{ following: user.is_following }"
              @click="handleFollowToggle(user.id)"
            >
              {{ user.is_following ? '언팔로우' : '팔로우' }}
            </button>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn-cancel" @click="closeFollowModal">닫기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:root {
  --primary: #00d15b;
  --bg: #f2f4f6;
  --text: #191f28;
  --glass: rgba(255, 255, 255, 0.9);
}

.mypage-container {
  background: var(--bg);
  min-height: 100vh;
  padding-bottom: 40px;
}

.loading {
  text-align: center;
  padding: 100px 20px;
  font-size: 1.2rem;
  color: #666;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px 16px;
}

/* 상단 그리드 레이아웃 */
.top-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .top-grid {
    grid-template-columns: 1fr;
  }
}

/* 카드 공통 스타일 */
.card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* 프로필 카드 */
.profile-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-compact {
  display: flex;
  gap: 16px;
  align-items: center;
}

.avatar {
  width: 80px;
  height: 80px;
  background: #eee;
  border-radius: 50%;
  border: 2px solid #f5f5f5;
  object-fit: cover;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-compact-actions {
  margin-left: auto;
}

.user-name {
  font-size: 1.5rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.user-email {
  color: #8b95a1;
  font-size: 0.9rem;
}

.level-badge {
  font-size: 0.75rem;
  background: #e8f5e9;
  color: #00d15b;
  padding: 4px 10px;
  border-radius: 8px;
  white-space: nowrap;
}

.btn-edit, .btn-follow {
  padding: 6px 14px;
  border-radius: 16px;
  border: 1px solid #e5e8eb;
  background: white;
  color: #4e5968;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: 0.2s;
  align-self: flex-start;
}

.btn-edit:hover {
  background: #f9f9f9;
  border-color: #ccc;
}

.btn-follow {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.btn-follow.following {
  background: white;
  color: var(--primary);
}

.btn-follow:hover {
  opacity: 0.9;
}

/* 소개글 & 태그 */
.intro-box {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #555;
  white-space: pre-line;
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-badge {
  background: #f2f4f6;
  color: #4e5968;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
}

.tag-country {
  background: #e3f2fd;
  color: #007aff;
}

/* 통계 컬럼 */
.stats-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-card, .level-card {
  padding: 16px;
}

/* 팔로워/팔로잉 통계 */
.follow-stats {
  display: flex;
  gap: 16px;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 12px;
  transition: 0.2s;
  flex: 1;
}

.stat-item:hover {
  background: #f9f9f9;
}

.stat-number {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--primary);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
}

/* 레벨 바 */
.level-card {
  background: #f9fafb;
}

.lv-info {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  margin-bottom: 8px;
  font-size: 0.85rem;
}

.progress-track {
  width: 100%;
  height: 6px;
  background: #e5e8eb;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--primary);
  border-radius: 10px;
  transition: width 0.3s;
}

/* 내 서재 가기 배너 */
.link-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #00d15b 0%, #00b54f 100%);
  color: white;
  padding: 18px 24px;
  border-radius: 16px;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(0, 209, 91, 0.15);
  transition: 0.2s;
  margin-bottom: 16px;
}

.link-banner:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 209, 91, 0.25);
}

.banner-text h3 {
  margin: 0 0 2px 0;
  font-size: 1.1rem;
}

.banner-text p {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.9;
}

/* 내 활동 카드 */
.activity-card {
  margin-top: 0;
}

.activity-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 2px solid #f2f4f6;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  border: none;
  background: none;
  font-weight: 600;
  color: #8b95a1;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: 0.2s;
  font-size: 0.9rem;
}

.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.activity-list {
  max-height: 350px;
  overflow-y: auto;
}

.activity-item {
  padding: 12px;
  border-bottom: 1px solid #f2f4f6;
  cursor: pointer;
  transition: 0.2s;
}

.activity-item:hover {
  background: #f9f9f9;
}

.activity-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.activity-sub {
  font-size: 0.8rem;
  color: #8b95a1;
  font-weight: 500;
}

.activity-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #191f28;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.activity-content-text {
  font-size: 0.85rem;
  color: #4e5968;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-date {
  font-size: 0.75rem;
  color: #adb5bd;
  white-space: nowrap;
}

.mini-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 15px 0;
}

.mini-pagination button {
  background: #f2f4f6;
  border: none;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #4e5968;
  cursor: pointer;
}

.mini-pagination button:disabled {
  opacity: 0.4;
  cursor: default;
}

.mini-pagination span {
  font-size: 0.8rem;
  font-weight: 700;
  color: #8b95a1;
}

.empty-state {
  text-align: center;
  padding: 30px 20px;
  color: #8b95a1;
  font-size: 0.9rem;
}

/* 모달 */
.modal-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  z-index: 999;
  justify-content: center;
  align-items: center;
}

.modal-overlay.active {
  display: flex;
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 30px;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  animation: popUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes popUp {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-title {
  font-size: 1.3rem;
  font-weight: 800;
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: #333;
}

.input-field {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 12px;
  margin-bottom: 20px;
  font-size: 1rem;
  outline: none;
  font-family: inherit;
}

.input-field:focus {
  border-color: var(--primary);
}

textarea.input-field {
  resize: none;
  height: 80px;
}

.btn-row {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.btn-confirm {
  flex: 1;
  background: var(--primary);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
}

.btn-cancel {
  flex: 1;
  background: #f2f4f6;
  color: #666;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
}

/* 팔로우 리스트 */
.follow-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.follow-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #f2f4f6;
}

.follow-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

.follow-info {
  flex: 1;
  cursor: pointer;
}

.follow-nickname {
  font-weight: 600;
  margin-bottom: 2px;
}

.follow-username {
  font-size: 0.85rem;
  color: #8b95a1;
}

.btn-follow-small {
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid var(--primary);
  background: var(--primary);
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: 0.2s;
}

.btn-follow-small.following {
  background: white;
  color: var(--primary);
}

.btn-follow-small:hover {
  opacity: 0.9;
}
</style>
