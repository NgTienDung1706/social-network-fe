import React, { useEffect, useState, useRef } from "react";
//import axios from "@/utils/axiosInstance";
import { getFollowingList } from "@/features/profile/profileAPI";
import FollowItem from "./FollowItem";
import useFollowList from "@/hooks/useFollowList";

const FollowingList = ({ username, onClose }) => {
  const [search, setSearch] = useState("");
  const modalRef = useRef(null);

  // Sử dụng custom hook để quản lý danh sách following với phân trang
  const {
    items: following,
    loading,
    lastItemRef,
  } = useFollowList(getFollowingList, username, 10);

  useEffect(() => {
    document.body.style.overflow = "hidden"; // chặn scroll
    return () => {
      document.body.style.overflow = ""; // khôi phục scroll
    };
  }, []);

  useEffect(() => {
    // luôn giữ gutter để layout không nhảy (không bắt buộc, nhưng nên có)
    document.documentElement.style.scrollbarGutter = "stable";

    const allowInsideModal = (target) =>
      modalRef.current && modalRef.current.contains(target);

    const onWheel = (e) => {
      if (!allowInsideModal(e.target)) e.preventDefault();
    };
    const onTouchMove = (e) => {
      if (!allowInsideModal(e.target)) e.preventDefault();
    };
    const onKeyDown = (e) => {
      // chặn phím cuộn khi focus không nằm trong modal
      const scrollKeys = [
        " ",
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
      ];
      if (scrollKeys.includes(e.key)) {
        const active = document.activeElement;
        if (!allowInsideModal(active)) e.preventDefault();
      }
    };

    // ĐĂNG KÝ listener ở window để bắt cả trang
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
      document.documentElement.style.scrollbarGutter = "";
    };
  }, []);

  // const handleUnfollow = async (followingId) => {
  //   await axios.delete(`/profile/${username}/following/${followingId}`);
  //   setFollowing((prev) =>
  //     prev.map((u) =>
  //       u._id === followingId
  //         ? {
  //             ...u,
  //             relationship_status: {
  //               ...u.relationship_status,
  //               following: false,
  //             },
  //           }
  //         : u
  //     )
  //   );
  // };

  const filtered = following.filter((u) => {
    const fullName = `${u.lastname} ${u.firstname}`.toLowerCase();
    return (
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      fullName.includes(search.toLowerCase())
    );
  });

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 flex items-center justify-center bg-black/40 bg-opacity-40 z-50"
    >
      <div
        className="bg-white rounded-xl shadow-lg p-4 relative"
        style={{ width: 600, height: 520 }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-xl font-bold text-gray-500 hover:text-black"
        >
          ×
        </button>
        <h2 className="text-center text-lg font-semibold mb-2">
          Đang theo dõi
        </h2>
        <input
          type="text"
          placeholder="Tìm kiếm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded-lg focus:outline-none focus:ring"
        />
        <div className="h-96 overflow-y-auto">
          {filtered.map((user, index) => {
            const isLast = index === filtered.length - 1;
            return (
              // <FollowingItem
              //   key={user._id}
              //   user={user}
              //   onUnfollow={handleUnfollow}
              //   ref={isLast ? lastPostRef : null}
              // />

              <FollowItem
                key={user._id}
                user={user}
                ref={isLast ? lastItemRef : null}
                mode="following"
              />
            );
          })}
          {loading && <div className="text-center py-2">Đang tải...</div>}
        </div>
      </div>
    </div>
  );
};

export default FollowingList;
