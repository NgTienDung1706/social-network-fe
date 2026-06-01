import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook để quản lý danh sách following/followers với phân trang
 * @param {Function} fetchFunction - Hàm API để fetch dữ liệu (params: username, page, limit)
 * @param {string} username - Username của user cần lấy danh sách
 * @param {number} limit - Số lượng items mỗi page (default: 10)
 * @returns {Object} { items, loading, hasMore, lastItemRef, resetList }
 */
const useFollowList = (fetchFunction, username, limit = 10) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [resetFlag, setResetFlag] = useState(false);

  const observer = useRef();

  // Ref callback cho IntersectionObserver (để load more)
  const lastItemRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // Reset khi username thay đổi
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setResetFlag(true);
  }, [username]);

  // Fetch data với pagination
  useEffect(() => {
    if (!hasMore) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Nếu là reset, load page 1
        if (resetFlag) {
          const res = await fetchFunction(username, 1, limit);
          setItems(Array.isArray(res.followings) ? res.followings : []);
          setHasMore(res.hasMore);
          setResetFlag(false);
          return;
        }

        // Load more pages
        if (page > 1) {
          const res = await fetchFunction(username, page, limit);
          setItems((prev) => [
            ...prev,
            ...(Array.isArray(res.followings) ? res.followings : []),
          ]);
          setHasMore(res.hasMore);
        }
      } catch (err) {
        console.error("Error fetching list:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username, page, hasMore, resetFlag, fetchFunction, limit]);

  // Function để reset list thủ công (nếu cần)
  const resetList = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setResetFlag(true);
  }, []);

  return {
    items,
    loading,
    hasMore,
    lastItemRef,
    resetList,
  };
};

export default useFollowList;
