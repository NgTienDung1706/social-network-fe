import { useEffect, useState } from "react";
import StickyBox from "react-sticky-box";
import { getProfile } from "@/features/profile/profileAPI";
import defaultavatar from "@/assets/defaultavatar.png";
import {
  FaEdit,
  FaUserShield,
  FaFlag,
  FaBorderAll,
  FaBookmark,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import UserPostList from "@/features/posts/components/UserPostList";
import FollowingList from "@/features/profile/components/FollowingList";
import FollowerList from "@/features/profile/components/FollowerList";
import OptionsMenu from "@/components/common/OptionsMenu";
import { followUser, unfollowUser } from "@/features/profile/profileAPI";
import { useConfirmModal } from "@/contexts/ConfirmModalContext";

function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return "---";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "---";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function Profile({ isOwnProfile = true, profileData = null }) {
  const [profile, setProfile] = useState(profileData);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("posts"); // State to manage the active tab
  const [hoverTab, setHoverTab] = useState(null); // Theo dõi tab được hover
  const [showFollowingList, setShowFollowingList] = useState(false);
  const [showFollowerList, setShowFollowerList] = useState(false);
  const { openConfirm } = useConfirmModal();
  const [loadingRelationship, setLoadingRelationship] = useState(false);

  const currentUser = useSelector((state) => state.auth.login.currentUser);
  const navigate = useNavigate();
  useEffect(() => {
    if (!profileData && isOwnProfile) {
      // Nếu đang xem profile của chính mình -> gọi API getProfile()
      const fetchProfile = async () => {
        try {
          const res = await getProfile();
          setProfile(res.user);
        } catch (err) {
          setError(err?.message || "Đã xảy ra lỗi");
        }
      };
      fetchProfile();
    }
  }, [isOwnProfile, profileData]);

  if (error) {
    return <div className="text-red-500 text-center mt-4">{error}</div>;
  }
  if (!profile) {
    return <div className="text-center mt-4">Đang tải thông tin...</div>;
  }

  const handleOptionSelect = async (action) => {
    switch (action) {
      case "edit":
        alert("Chức năng chỉnh sửa trang chưa được triển khai");
        break;
      case "block":
        alert("Đã chặn người dùng này");
        break;
      case "report":
        alert("Đã gửi báo cáo người dùng");
        break;
      default:
        console.log(`Action ${action} not handled`);
    }
  };

  const profileOptions = [
    {
      icon: <FaEdit />,
      label: "Chỉnh sửa trang",
      action: () => handleOptionSelect("edit"),
    },
    {
      icon: <FaUserShield />,
      label: "Chặn người dùng",
      action: () => handleOptionSelect("block"),
    },
    {
      icon: <FaFlag />,
      label: "Báo cáo",
      action: () => handleOptionSelect("report"),
    },
  ];

  // Tính toán vị trí của thanh gạch dựa trên tab active hoặc hover
  const getTabPosition = () => {
    const tabs = ["posts", "saved"];
    const index = hoverTab ? tabs.indexOf(hoverTab) : tabs.indexOf(tab);
    return {
      left: `${(index * 100) / tabs.length}%`,
      width: `${100 / tabs.length}%`,
    };
  };

  const handleFollow = async (userId) => {
    openConfirm(
      "Xác nhận theo dõi",
      "Bạn có chắc muốn theo dõi người này không?",
      async () => {
        setLoadingRelationship(true);
        const res = await followUser(userId);
        if (res) {
          setProfile((prev) => ({
            ...prev,
            relationship_status: {
              ...prev.relationship_status,
              following: true,
            },
          }));
        }
        setLoadingRelationship(false);
      }
    );
  };

  const handleUnfollow = async (userId) => {
    openConfirm(
      "Xác nhận bỏ theo dõi",
      "Bạn có chắc muốn bỏ theo dõi người này không?",
      async () => {
        setLoadingRelationship(true);
        const res = await unfollowUser(userId);
        if (res) {
          setProfile((prev) => ({
            ...prev,
            relationship_status: {
              ...prev.relationship_status,
              following: false,
            },
          }));
        }
        setLoadingRelationship(false);
      }
    );
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col lg:flex-row lg:justify-center lg:gap-8">
      {/* Left: Profile Card */}
      <div className="w-full lg:w-[350px]">
        <StickyBox offsetTop={20} offsetBottom={20}>
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-start">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-brand-green flex items-center justify-center relative mb-2 self-center">
              <img
                src={profile.profile.avatar || defaultavatar}
                alt="Avatar"
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="text-lg sm:text-xl font-bold mb-4 sm:mb-5 mt-2 text-center self-center">
              {`${profile?.profile?.lastname || ""} ${
                profile?.profile?.firstname || ""
              }`}
            </div>

            {/* Thống kê số bài viết, số bạn bè */}
            <div className="flex w-full mb-4 mt-2 px-4 sm:px-6">
              <div className="flex-1 flex flex-col items-center">
                <span className="text-base sm:text-lg font-bold text-gray-800">
                  {profile.postCount ?? 0}
                </span>
                <span className="text-xs text-gray-500 font-semibold">
                  Bài viết
                </span>
              </div>
              <div className="flex-1 flex flex-col items-center cursor-pointer">
                <span
                  className="text-base sm:text-lg font-bold text-gray-800"
                  onClick={() => setShowFollowerList(true)}
                >
                  {profile.followerCount ?? 0}
                </span>
                <span
                  className="text-xs text-gray-500 font-semibold"
                  onClick={() => setShowFollowerList(true)}
                >
                  Người theo dõi
                </span>
              </div>

              <div className="flex-1 flex flex-col items-center cursor-pointer">
                <span
                  className="text-base sm:text-lg font-bold text-gray-800"
                  onClick={() => setShowFollowingList(true)}
                >
                  {profile.followingCount ?? 0}
                </span>
                <span
                  className="text-xs text-gray-500 font-semibold"
                  onClick={() => setShowFollowingList(true)}
                >
                  Đang theo dõi
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2 w-full">
              <div className="text-gray-500 text-sm truncate flex-1">
                {profile.username}
              </div>
              {/* Icon giới tính */}
              <div className="mb-2 flex-shrink-0">
                {profile.profile.gender === "male" && (
                  <span
                    title="Nam"
                    className="text-blue-500 text-base sm:text-lg"
                  >
                    ♂️
                  </span>
                )}
                {profile.profile.gender === "female" && (
                  <span
                    title="Nữ"
                    className="text-pink-500 text-base sm:text-lg"
                  >
                    ♀️
                  </span>
                )}
                {(!profile.profile.gender ||
                  (profile.profile.gender !== "male" &&
                    profile.profile.gender !== "female")) && (
                  <span
                    title="Khác"
                    className="text-gray-400 text-base sm:text-lg"
                  >
                    ⚧️
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-start gap-2 mb-4 w-full">
              {isOwnProfile ? (
                <button
                  className="flex items-center justify-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium flex-1"
                  onClick={() =>
                    navigate("/edit-profile", {
                      state: {
                        avatar: profile.profile.avatar,
                        username: profile.username,
                        lastname: profile.profile?.lastname,
                        firstname: profile.profile?.firstname,
                        birthday: profile.profile?.birthday,
                        bio: profile.profile?.bio,
                      },
                    })
                  }
                >
                  <FaEdit /> Sửa Hồ Sơ
                </button>
              ) : (
                <>
                  {profile.relationship_status?.following ? (
                    <button
                      className="flex items-center justify-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium flex-1"
                      onClick={() => handleUnfollow(profile._id)}
                      disabled={loadingRelationship}
                    >
                      Đang theo dõi
                    </button>
                  ) : (
                    <button
                      className="flex items-center justify-center gap-1 px-3 py-1 bg-brand-green text-white rounded-lg text-sm font-medium flex-1 hover:bg-green-600"
                      onClick={() => handleFollow(profile._id)}
                      disabled={loadingRelationship}
                    >
                      Theo dõi
                    </button>
                  )}
                  <button className="flex items-center justify-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium flex-1">
                    Nhắn tin
                  </button>
                </>
              )}
              <div className="flex-shrink-0">
                <OptionsMenu options={profileOptions} />
              </div>
            </div>

            <div className="text-xs text-gray-400 mb-2">Ngày Sinh</div>
            <div className="text-sm font-medium mb-4">
              {formatDateDDMMYYYY(profile.profile.birthday)}
            </div>

            <div className="text-xs text-gray-400 mb-2">
              Giới thiệu bản thân
            </div>
            <div className="text-sm font-medium mb-4 whitespace-pre-line">
              {profile.profile.bio}
            </div>

            <div className="text-xs text-gray-400 mb-2">Gia Nhập Từ</div>
            <div className="text-sm font-medium mb-4">
              {formatDateDDMMYYYY(profile.createdAt)}
            </div>
          </div>
        </StickyBox>
      </div>
      {/* Right: Activity & Connections */}
      <div className="flex-1 bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 flex flex-col h-auto justify-center min-h-[50vh]">
        {" "}
        {/* SỬA: Giảm padding, thêm min-h trên mobile */}
        {/* Tabs */}
        <div className="bg-white text-black p-2 relative rounded-t-lg overflow-hidden">
          {" "}
          {/* SỬA: Thêm rounded-t-lg và overflow-hidden để đẹp hơn trên mobile */}
          <div className="flex flex-col sm:flex-row sm:justify-around">
            {" "}
            {/* SỬA: Stack tabs trên mobile, row trên sm */}
            <button
              className={`relative p-3 sm:p-2 flex font-semibold items-center justify-center gap-1 transition-all duration-300 border-b sm:border-b-0 w-full sm:w-auto ${
                tab === "posts"
                  ? "text-black border-brand-green"
                  : "text-gray-600 border-gray-200" // SỬA: Border bottom cho active/non-active trên mobile, transition-all cho mượt
              }`}
              onClick={() => setTab("posts")}
              onMouseEnter={() => setHoverTab("posts")}
              onMouseLeave={() => setHoverTab(null)}
              title="Post"
            >
              <FaBorderAll className="text-xl sm:text-lg flex-shrink-0" />{" "}
              {/* SỬA: Icon lớn hơn một chút trên mobile */}
              <span className="hidden sm:inline">Bài viết</span>{" "}
              {/* SỬA: Ẩn text tab trên mobile để gọn */}
            </button>
            <button
              className={`relative p-3 sm:p-2 flex font-semibold items-center justify-center gap-1 transition-all duration-300 border-b sm:border-b-0 w-full sm:w-auto ${
                tab === "saved"
                  ? "text-black border-brand-green"
                  : "text-gray-600 border-gray-200" // SỬA: Border bottom cho active/non-active trên mobile, transition-all cho mượt
              }`}
              onClick={() => setTab("saved")}
              onMouseEnter={() => setHoverTab("saved")}
              onMouseLeave={() => setHoverTab(null)}
              title="Đã lưu"
            >
              <FaBookmark className="text-xl sm:text-lg flex-shrink-0" />{" "}
              {/* SỬA: Icon lớn hơn một chút trên mobile */}
              <span className="hidden sm:inline">Đã lưu</span>{" "}
              {/* SỬA: Ẩn text tab trên mobile để gọn */}
            </button>
          </div>
          {/* SỬA: Ẩn indicator trên mobile, chỉ hiển thị trên sm+ */}
          <div
            className="hidden sm:block absolute bottom-0 h-1 bg-gradient-to-r from-brand-green to-brand-blue transition-all duration-300 ease-in-out rounded-full"
            style={{
              left: getTabPosition().left,
              width: getTabPosition().width,
            }}
          />
        </div>
        {/* Tab content */}
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          {tab === "posts" ? (
            <div className="w-full">
              <UserPostList
                username={!isOwnProfile ? profile.username : undefined}
              />
            </div>
          ) : (
            <div className="w-full">
              <div className="text-gray-500 text-center">
                Chưa có bài viết nào được lưu.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FollowingList modal */}
      {showFollowingList && (
        <FollowingList
          username={isOwnProfile ? currentUser.username : profile.username}
          onClose={() => setShowFollowingList(false)}
        />
      )}
      {/* FollowerList modal */}
      {showFollowerList && (
        <FollowerList
          username={isOwnProfile ? currentUser.username : profile.username}
          onClose={() => setShowFollowerList(false)}
        />
      )}
    </div>
  );
}

export default Profile;
