import {
  FaRegHeart,
  FaRegComment,
  FaRegShareSquare,
  FaCog,
  FaClosedCaptioning,
  FaVolumeUp,
  FaHeartBroken,
  FaFlag,
  FaBookmark,
} from "react-icons/fa";
import { useState, useMemo, useEffect, useRef, act } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import ProfileTooltipWrapper from "@/components/tooltips/ProfileTooltipWrapper";
import UserListModal from "@/components/modals/UserListModal";
import OptionsMenu from "@/components/common/OptionsMenu";

dayjs.extend(relativeTime);
dayjs.locale("vi");

function formatTimeAgo(time) {
  if (!time) return "";

  const now = dayjs();
  const diffMinutes = now.diff(time, "minute");
  const diffHours = now.diff(time, "hour");
  const diffDays = now.diff(time, "day");

  if (diffMinutes < 60) {
    return `${diffMinutes <= 0 ? 1 : diffMinutes} phút`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ`;
  } else {
    return `${diffDays} ngày`;
  }
}

function PostItem({
  avatar,
  username,
  time,
  caption,
  hashtags,
  media,
  emotion,
  tagged_users,
  location,
  isStory,
  visibility,
  likes,
  commentCount,
}) {
  const [current, setCurrent] = useState(0);
  const [maxHeight, setMaxHeight] = useState(0);
  const touchTimeout = useRef(null);
  const isButtonPressed = useRef(false);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(468);
  const navigate = useNavigate();
  const [showTaggedUsersModal, setShowTaggedUsersModal] = useState(false);

  // Xử lý media: mảng URL (ảnh) hoặc chuỗi URL (video)
  const mediaList = useMemo(() => {
    if (!media) return [];
    return Array.isArray(media) ? media : [media];
  }, [media]);

  // const isVideo = useMemo(() => {
  //   return (
  //     !Array.isArray(media) ||
  //     (mediaList.length === 1 && mediaList[0].endsWith(".mp4")) ||
  //     mediaList[0].includes("/video/")
  //   );
  // }, [media, mediaList]);
  const isVideo = useMemo(() => {
    if (!mediaList || mediaList.length === 0) return false;
    return (
      !Array.isArray(media) ||
      (mediaList.length === 1 &&
        mediaList[0] &&
        (mediaList[0].endsWith(".mp4") || mediaList[0].includes("/video/")))
    );
  }, [media, mediaList]);

  useEffect(() => {
    function updateWidth() {
      if (containerRef.current) {
        const actualWidth = containerRef.current.offsetWidth;
        setContainerWidth(actualWidth < 468 ? actualWidth : 468);
      }
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Touch swipe cho ảnh (không áp dụng cho video)
  const startX = useRef(0);
  const endX = useRef(0);

  const handleTouchStart = (e) => {
    if (isVideo) return; // Không swipe cho video
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (isVideo) return;
    endX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (isVideo || isButtonPressed.current) {
      isButtonPressed.current = false;
      return;
    }

    if (touchTimeout.current) return;
    touchTimeout.current = setTimeout(() => {
      touchTimeout.current = null;
    }, 500);

    const distance = endX.current - startX.current;
    if (distance > 50) {
      setCurrent((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1));
    } else if (distance < -50) {
      setCurrent((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1));
    }
    startX.current = 0;
    endX.current = 0;
  };

  const handlePrev = () => {
    if (isVideo) return;
    setCurrent((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (isVideo) return;
    setCurrent((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1));
  };

  // Tính toán chiều cao tối đa cho ảnh
  useEffect(() => {
    if (!isVideo && mediaList.length > 0) {
      let highest = 0;
      let loaded = 0;
      const ratios = [];

      mediaList.forEach((src, idx) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          const ratio = img.height / img.width;
          const scaledHeight = ratio * containerWidth;
          highest = Math.max(highest, scaledHeight);
          ratios[idx] = ratio;
          loaded++;
          if (loaded === mediaList.length) {
            setMaxHeight(Math.min(highest)); // Giới hạn chiều cao
          }
        };
        img.onerror = () => {
          ratios[idx] = 1;
          loaded++;
          if (loaded === mediaList.length) {
            setMaxHeight(containerWidth);
          }
        };
      });
    } else {
      // Cho video, set chiều cao mặc định
      setMaxHeight(containerWidth * 0.5625); // 16:9 aspect ratio
    }
  }, [mediaList, containerWidth, isVideo]);

  const getTaggedDisplayText = () => {
    if (tagged_users.length === 0) return "";
    if (tagged_users.length === 1) {
      return (
        <>
          <span className="text-gray-500"> cùng với </span>
          <ProfileTooltipWrapper user={tagged_users[0]}>
            <span
              className="hover:underline cursor-pointer"
              onClick={() => {
                navigate(`/profile/${tagged_users[0].username}`);
              }}
            >
              {tagged_users[0].username}
            </span>
          </ProfileTooltipWrapper>
        </>
      );
    } else if (tagged_users.length === 2) {
      return (
        <>
          <span className="text-gray-500"> cùng </span>
          <ProfileTooltipWrapper user={tagged_users[0]}>
            <span
              className="hover:underline cursor-pointer"
              onClick={() => {
                navigate(`/profile/${tagged_users[0].username}`);
              }}
            >
              {tagged_users[0].username}
            </span>
          </ProfileTooltipWrapper>
          <span className="text-gray-500"> và </span>
          <ProfileTooltipWrapper user={tagged_users[1]}>
            <span
              className="hover:underline cursor-pointer"
              onClick={() => {
                navigate(`/profile/${tagged_users[1].username}`);
              }}
            >
              {tagged_users[1].username}
            </span>
          </ProfileTooltipWrapper>
        </>
      );
    } else {
      return (
        <>
          <span className="text-gray-500"> cùng </span>
          <ProfileTooltipWrapper user={tagged_users[0]}>
            <span
              className="hover:underline cursor-pointer"
              onClick={() => {
                navigate(`/profile/${tagged_users[0].username}`);
              }}
            >
              {tagged_users[0].username}
            </span>
          </ProfileTooltipWrapper>
          <span className="text-gray-500"> và </span>
          <span
            className="hover:underline cursor-pointer"
            onClick={() => setShowTaggedUsersModal(true)}
          >
            {tagged_users.length - 1} người khác
          </span>
        </>
      );
    }
  };

  // Hàm xử lý hashtag trong caption
  const renderCaptionWithHashtags = () => {
    if (!caption) return null;

    // Tách caption thành các phần, xử lý hashtag
    const hashtagRegex = /#[^\s#]+/g;
    const elements = [];

    const lines = caption.split("\n");
    lines.forEach((line, lineIndex) => {
      const lineParts = line.split(hashtagRegex);
      const lineHashtags = line.match(hashtagRegex) || [];
      //let charIndex = 0;

      lineParts.forEach((part, i) => {
        if (part) {
          elements.push(<span key={`part-${lineIndex}-${i}`}>{part}</span>);
          //charIndex += part.length;
        }
        if (lineHashtags[i]) {
          elements.push(
            <span
              key={`hashtag-${lineIndex}-${i}`}
              className="text-blue-500 hover:underline cursor-pointer text-sm font-medium"
              onClick={() => {
                // Thêm logic khi nhấn vào hashtag, ví dụ: điều hướng
                console.log(`Clicked hashtag: ${lineHashtags[i]}`);
                // Ví dụ: window.location.href = `/search?q=${lineHashtags[i].slice(1)}`;
                // navigate(`/search?q=${lineHashtags[i].slice(1)}`)
              }}
            >
              {lineHashtags[i]}
            </span>
          );
          //charIndex += lineHashtags[i].length;
        }
      });

      // Thêm xuống dòng nếu không phải dòng cuối
      if (lineIndex < lines.length - 1) {
        elements.push(<br key={`br-${lineIndex}`} />);
      }
    });

    return elements;
  };

  const handleOptionSelect = async (action) => {
    switch (action) {
      case "save":
        // Logic lưu bài viết
        alert("Đã lưu bài viết (chưa triển khai)");
        break;
      case "quality":
        // Logic thay đổi chất lượng (ví dụ: hiển thị modal chọn chất lượng)
        alert("Chọn chất lượng video (chưa triển khai)");
        break;
      case "subtitle":
        // Logic bật/tắt phụ đề
        alert("Bật/tắt phụ đề (chưa triển khai)");
        break;
      case "voice":
        // Logic chuyển đổi trình phát nội
        alert("Chuyển đổi trình phát nội (chưa triển khai)");
        break;
      case "ignore":
        // Gọi API để không quan tâm bài viết
        alert("Đã không quan tâm bài viết này");
        break;
      case "report":
        // Gọi API để báo cáo bài viết
        alert("Đã gửi báo cáo bài viết");
        break;
      default:
        console.log(`Action ${action} not handled`);
    }
  };

  const postOptions = [
    {
      icon: <FaBookmark />,
      label: "Lưu bài viết",
      action: () => handleOptionSelect("save"),
    },
    {
      icon: <FaCog />,
      label: "Chất lượng",
      action: () => handleOptionSelect("quality"),
    },
    {
      icon: <FaClosedCaptioning />,
      label: "Phụ đề",
      action: () => handleOptionSelect("subtitle"),
    },
    {
      icon: <FaCog />,
      label: "Cường độ điều chỉnh",
      action: () => {},
      //toggle: true,
      //value: false,
      //onToggle: () => console.log("Toggle adjustment"),
    },
    {
      icon: <FaVolumeUp />,
      label: "Trình phát nội",
      action: () => handleOptionSelect("voice"),
    },
    {
      icon: <FaHeartBroken />,
      label: "Không quan tâm",
      action: () => handleOptionSelect("ignore"),
    },
    {
      icon: <FaFlag />,
      label: "Báo cáo",
      action: () => handleOptionSelect("report"),
    },
  ];

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-lg shadow-md border-b-2 border-gray-300 py-4 w-full max-w-[468px] mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3 mb-2">
          <img
            src={avatar}
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 text-sm">
              {username}
              {tagged_users && getTaggedDisplayText()}
            </span>
            <span className="text-xs text-gray-500">
              {formatTimeAgo(time)}
              {isStory && <span className="ml-2 text-blue-500">• Story</span>}
              {visibility !== "public" && (
                <span className="ml-1 text-green-500">
                  {visibility === "friends" ? "👥" : "🔒"}
                </span>
              )}
            </span>
          </div>
        </div>
        <OptionsMenu options={postOptions} />
      </div>

      {/* Emotion */}
      {emotion?.label && (
        <div className="px-4 mt-2 mb-2">
          <span className="text-sm text-gray-600">
            Đang cảm thấy <span className="font-medium">{emotion.label}</span>{" "}
            {emotion.icon}
          </span>
        </div>
      )}
      {/* Tagged Users */}
      {/* {tagged_users && tagged_users.length > 0 && (
        <div className="px-4 mb-2">
          <span className="text-gray-600 text-sm">
            Cùng với{" "}
            {tagged_users.map((u, idx) => (
              <span
                key={idx}
                className="font-medium hover:underline cursor-pointer"
              >
                {u.username}
                {idx < tagged_users.length - 1 ? ", " : ""}
              </span>
            ))}
          </span>
        </div>
      )} */}

      {/* Media (Image Carousel hoặc Video) */}
      {mediaList.length > 0 && (
        <div
          className="relative w-full bg-black rounded-lg overflow-hidden"
          style={{ height: maxHeight }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {isVideo ? (
            // Hiển thị video
            <video
              src={mediaList[0]}
              controls
              className="w-full h-full object-contain"
              preload="metadata"
            />
          ) : (
            // Hiển thị ảnh carousel
            mediaList.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`post-img-${idx}`}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ease-in-out ${
                  idx === current ? "opacity-100" : "opacity-0"
                }`}
              />
            ))
          )}

          {/* Navigation cho ảnh (không hiển thị cho video) */}
          {!isVideo && mediaList.length > 1 && (
            <>
              <button
                className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 text-white rounded-full w-8 h-8 items-center justify-center hover:bg-opacity-60 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  isButtonPressed.current = true;
                  handlePrev();
                }}
              >
                &#8592;
              </button>
              <button
                className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 text-white rounded-full w-8 h-8 items-center justify-center hover:bg-opacity-60 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  isButtonPressed.current = true;
                  handleNext();
                }}
              >
                &#8594;
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {mediaList.map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-2 h-2 rounded-full ${
                      idx === current ? "bg-blue-500" : "bg-gray-300"
                    } inline-block`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Location */}
      {location && (
        <div className="px-4 mb-2">
          <span className="text-sm text-gray-600">📍 {location}</span>
        </div>
      )}

      {/* Caption */}
      {/* Caption với hashtag được highlight */}
      {caption && (
        <div className="text-gray-800 text-sm my-2 px-4 whitespace-pre-line">
          {renderCaptionWithHashtags()}
        </div>
      )}

      {/* Hashtags */}
      {/* {Array.isArray(hashtags) && hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4">
          {hashtags.map((tag, idx) => (
            <span
              key={idx}
              className="text-blue-500 text-sm font-medium hover:underline cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      )} */}

      {/* Action Buttons */}
      <div className="flex gap-6 text-xl text-gray-700 my-2 px-4">
        <button className="hover:text-pink-500 transition-colors">
          <FaRegHeart />
        </button>
        <button className="hover:text-blue-500 transition-colors">
          <FaRegComment />
        </button>
        <button className="hover:text-green-600 transition-colors">
          <FaRegShareSquare />
        </button>
      </div>

      {/* Stats */}
      <div className="text-xs text-gray-500 px-4 pb-2">
        {likes} lượt thích • {commentCount} bình luận
      </div>

      {/* Modal for tagged users */}
      {showTaggedUsersModal && (
        <UserListModal
          title="Những người khác"
          users={tagged_users.slice(1)} // Hiển thị từ người thứ 2 trở đi
          onClose={() => setShowTaggedUsersModal(false)}
          mode="tagged"
        />
      )}
    </div>
  );
}

export default PostItem;
