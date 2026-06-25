"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

export const TOAST_MESSAGES: Record<string, { title: string; description: string; type: "success" | "error" }> = {
  category_created: {
    title: "Đã tạo chuyên mục",
    description: "Chuyên mục mới đã được lưu thành công.",
    type: "success",
  },
  category_updated: {
    title: "Đã cập nhật chuyên mục",
    description: "Thông tin chuyên mục đã được cập nhật.",
    type: "success",
  },
  category_reordered: {
    title: "Đã cập nhật thứ tự",
    description: "Thứ tự chuyên mục đã được sắp xếp lại.",
    type: "success",
  },
  category_deleted: {
    title: "Đã xóa chuyên mục",
    description: "Chuyên mục đã được xóa an toàn.",
    type: "success",
  },
  category_delete_failed: {
    title: "Không thể xóa chuyên mục",
    description: "Vui lòng chọn chuyên mục đích để chuyển bài viết trước khi xóa.",
    type: "error",
  },
  category_reorder_failed: {
    title: "Không thể sắp xếp",
    description: "Thao tác sắp xếp không hợp lệ. Vui lòng thử lại.",
    type: "error",
  },
  post_created: {
    title: "Đăng bài thành công",
    description: "Bài viết đã được lưu và chuyển sang kho bài.",
    type: "success",
  },
  post_published: {
    title: "Đã xuất bản bài viết",
    description: "Bài viết đã được xuất bản lên Kho bài.",
    type: "success",
  },
  post_saved_draft: {
    title: "Đã lưu nháp",
    description: "Bài viết đã được lưu vào Lưu trữ cá nhân.",
    type: "success",
  },
  post_submitted_review: {
    title: "Đã gửi chờ duyệt",
    description: "Bài viết của bạn đã vào kho chờ duyệt.",
    type: "success",
  },
  post_submitted_publish: {
    title: "Đã gửi chờ xuất bản",
    description: "Bài viết đã được chuyển sang kho chờ xuất bản.",
    type: "success",
  },
  post_updated_published: {
    title: "Đã cập nhật và xuất bản",
    description: "Thay đổi đã được lưu và bài đang ở trạng thái xuất bản.",
    type: "success",
  },
  post_updated_review: {
    title: "Đã cập nhật bài viết",
    description: "Thay đổi đã được lưu và bài đang ở trạng thái chờ duyệt.",
    type: "success",
  },
  post_approved: {
    title: "Đã duyệt bài",
    description: "Bài viết đã được xuất bản.",
    type: "success",
  },
  post_rejected: {
    title: "Đã từ chối bài",
    description: "Bài viết đã được chuyển sang trạng thái từ chối.",
    type: "success",
  },
  post_returned_review: {
    title: "Đã trả về chờ duyệt",
    description: "Bài viết đã được trả về kho chờ duyệt để biên tập lại.",
    type: "success",
  },
  post_returned_publish_queue: {
    title: "Đã trả về chờ xuất bản",
    description: "Bài viết đã được chuyển về kho chờ xuất bản.",
    type: "success",
  },
  post_returned_draft: {
    title: "Đã trả về kho",
    description: "Bài viết đã được trả về kho nháp.",
    type: "success",
  },
  post_moved_trash: {
    title: "Đã chuyển vào thùng rác",
    description: "Bài viết đã được chuyển sang Thùng rác.",
    type: "success",
  },
  post_restored: {
    title: "Đã khôi phục bài viết",
    description: "Bài viết đã được khôi phục khỏi Thùng rác.",
    type: "success",
  },
  post_deleted_permanently: {
    title: "Đã xóa vĩnh viễn",
    description: "Bài viết đã bị xóa vĩnh viễn khỏi hệ thống.",
    type: "success",
  },
  post_not_found: {
    title: "Không tìm thấy bài viết",
    description: "Bài viết có thể đã bị xóa hoặc không còn tồn tại.",
    type: "error",
  },
  post_action_forbidden: {
    title: "Không có quyền thao tác",
    description: "Bạn không có quyền thực hiện thao tác này với bài viết.",
    type: "error",
  },
  post_action_failed: {
    title: "Thao tác thất bại",
    description: "Dữ liệu thao tác không hợp lệ. Vui lòng thử lại.",
    type: "error",
  },
  search_console_check_queued: {
    title: "Đã xếp hàng kiểm tra index",
    description: "CMS sẽ gọi URL Inspection API và cập nhật trạng thái trong bảng bài.",
    type: "success",
  },
  search_console_check_unavailable: {
    title: "Chưa thể kiểm tra index",
    description: "Chỉ bài viết đã xuất bản công khai mới có thể kiểm tra trạng thái index.",
    type: "error",
  },
  comment_approved: {
    title: "Đã duyệt bình luận",
    description: "Bình luận đã được hiển thị công khai.",
    type: "success",
  },
  comment_deleted: {
    title: "Đã xóa bình luận",
    description: "Bình luận đã được xóa khỏi hệ thống.",
    type: "success",
  },
  comment_action_failed: {
    title: "Thao tác bình luận thất bại",
    description: "Dữ liệu thao tác không hợp lệ. Vui lòng thử lại.",
    type: "error",
  },
  missing_fields: {
    title: "Thiếu thông tin bắt buộc",
    description: "Vui lòng nhập đầy đủ các trường thông tin được yêu cầu.",
    type: "error",
  },
  media_uploaded: {
    title: "Đã tải media",
    description: "Media đã được lưu vào kho dữ liệu.",
    type: "success",
  },
  media_upload_failed: {
    title: "Upload thất bại",
    description: "Vui lòng kiểm tra định dạng hoặc dung lượng tệp.",
    type: "error",
  },
  media_deleted: {
    title: "Đã xóa media",
    description: "Media đã được xóa khỏi kho dữ liệu.",
    type: "success",
  },
  media_delete_failed: {
    title: "Xóa media thất bại",
    description: "Bạn không có quyền hoặc media không còn tồn tại.",
    type: "error",
  },
  password_mock_saved: {
    title: "Mock đổi mật khẩu",
    description: "Đã ghi nhận thao tác mock. Chưa có logic đổi mật khẩu thật.",
    type: "success",
  },
  account_created: {
    title: "Đã tạo tài khoản",
    description: "Tài khoản cấp dưới đã được tạo thành công.",
    type: "success",
  },
  account_create_failed: {
    title: "Không thể tạo tài khoản",
    description: "Vui lòng kiểm tra lại thông tin đầu vào.",
    type: "error",
  },
  account_create_forbidden: {
    title: "Không đủ quyền",
    description: "Bạn không có quyền tạo role đã chọn.",
    type: "error",
  },
  account_create_duplicated: {
    title: "Email đã tồn tại",
    description: "Vui lòng chọn email khác.",
    type: "error",
  },
  permissions_updated: {
    title: "Đã cập nhật phân quyền",
    description: "Quyền hạn của role đã được lưu thành công.",
    type: "success",
  },
  permissions_update_failed: {
    title: "Không thể cập nhật phân quyền",
    description: "Bạn không có quyền thực hiện thao tác này.",
    type: "error",
  },
  pen_name_saved: {
    title: "Đã lưu bút danh",
    description: "Thông tin bút danh đã được cập nhật.",
    type: "success",
  },
  pen_name_deleted: {
    title: "Đã xóa bút danh",
    description: "Bút danh đã được xóa, bài cũ vẫn giữ tên hiển thị đã lưu.",
    type: "success",
  },
  pen_name_avatar_removed: {
    title: "Đã gỡ ảnh bút danh",
    description: "Ảnh đại diện đã được xóa khỏi Cloudinary.",
    type: "success",
  },
  pen_name_duplicated: {
    title: "Bút danh đã tồn tại",
    description: "Vui lòng dùng một tên bút danh khác.",
    type: "error",
  },
  pen_name_not_found: {
    title: "Không tìm thấy bút danh",
    description: "Bút danh có thể đã bị xóa trước đó.",
    type: "error",
  },
  pen_name_save_failed: {
    title: "Không thể lưu bút danh",
    description: "Vui lòng kiểm tra lại tên và ảnh đại diện.",
    type: "error",
  },
  pen_name_delete_failed: {
    title: "Không thể xóa bút danh",
    description: "Dữ liệu thao tác không hợp lệ. Vui lòng thử lại.",
    type: "error",
  },
  pen_name_avatar_upload_failed: {
    title: "Upload ảnh bút danh thất bại",
    description: "Vui lòng chọn ảnh hợp lệ dưới 5MB.",
    type: "error",
  },
  pen_name_action_forbidden: {
    title: "Không có quyền chỉnh bút danh",
    description: "Role hiện tại chưa được cấp quyền Chỉnh sửa bút danh.",
    type: "error",
  },
  user_role_updated: {
    title: "Đã cập nhật vai trò",
    description: "Vai trò người dùng đã được thay đổi thành công.",
    type: "success",
  },
  user_role_update_failed: {
    title: "Không thể đổi vai trò",
    description: "Thao tác không hợp lệ hoặc không có quyền.",
    type: "error",
  },
  user_deleted: {
    title: "Đã xóa tài khoản",
    description: "Tài khoản người dùng đã được xóa khỏi hệ thống.",
    type: "success",
  },
  user_delete_failed: {
    title: "Không thể xóa tài khoản",
    description: "Người dùng không tồn tại hoặc có lỗi xảy ra.",
    type: "error",
  },
  user_delete_forbidden: {
    title: "Không đủ quyền xóa",
    description: "Bạn không thể xóa tài khoản này.",
    type: "error",
  },
}

export function showToastByKey(toastKey: string) {
  const message = TOAST_MESSAGES[toastKey]
  if (!message) return

  if (message.type === "success") {
    toast.success(message.title, { description: message.description })
  } else {
    toast.error(message.title, { description: message.description })
  }
}

export function AdminActionToast() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const lastShownKeyRef = useRef<string | null>(null)

  useEffect(() => {
    const toastKey = searchParams.get("toast")
    if (!toastKey) {
      lastShownKeyRef.current = null
      return
    }

    if (lastShownKeyRef.current === toastKey) {
      return
    }
    lastShownKeyRef.current = toastKey

    const message = TOAST_MESSAGES[toastKey]
    if (message) {
      if (message.type === "success") {
        toast.success(message.title, { description: message.description })
      } else {
        toast.error(message.title, { description: message.description })
      }
    }

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete("toast")
    nextParams.delete("moved")
    nextParams.delete("direction")
    const nextQuery = nextParams.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  return null
}
