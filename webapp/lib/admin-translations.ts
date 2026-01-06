// Admin Dashboard Translations - Thai and English

export type AdminLanguage = 'th' | 'en';

export const adminTranslations = {
  // Dashboard
  dashboard: {
    title: { th: 'Admin Dashboard', en: 'Admin Dashboard' },
    welcome: { th: 'ยินดีต้อนรับ Admin', en: 'Welcome, Admin' },
    overview: { th: 'ภาพรวม', en: 'Overview' },
  },

  // Navigation Tabs
  tabs: {
    customers: { th: 'ลูกค้า', en: 'Customers' },
    payments: { th: 'การชำระเงิน', en: 'Payments' },
    coupons: { th: 'คูปอง', en: 'Coupons' },
    activityLogs: { th: 'บันทึกกิจกรรม', en: 'Activity Logs' },
    reports: { th: 'รายงาน', en: 'Reports' },
  },

  // Statistics Cards
  stats: {
    totalUsers: { th: 'ผู้ใช้ทั้งหมด', en: 'Total Users' },
    activeSubscriptions: { th: 'Subscription ที่ใช้งาน', en: 'Active Subscriptions' },
    pendingApprovals: { th: 'รอการอนุมัติ', en: 'Pending Approvals' },
    monthlyRevenue: { th: 'รายได้เดือนนี้', en: 'Monthly Revenue' },
    totalRestaurants: { th: 'ร้านอาหารทั้งหมด', en: 'Total Restaurants' },
    newUsersToday: { th: 'ผู้ใช้ใหม่วันนี้', en: 'New Users Today' },
    expiringTrials: { th: 'Trial ใกล้หมดอายุ', en: 'Expiring Trials' },
    mrr: { th: 'รายได้ประจำต่อเดือน', en: 'Monthly Recurring Revenue' },
  },

  // Plans
  plans: {
    free_trial: { th: 'ทดลองใช้ฟรี', en: 'Free Trial' },
    starter: { th: 'Starter', en: 'Starter' },
    professional: { th: 'Professional', en: 'Professional' },
    enterprise: { th: 'Enterprise', en: 'Enterprise' },
    admin: { th: 'Admin', en: 'Admin' },
  },

  // Subscription Status
  subscriptionStatus: {
    trial: { th: 'ทดลองใช้', en: 'Trial' },
    active: { th: 'ใช้งานอยู่', en: 'Active' },
    expired: { th: 'หมดอายุ', en: 'Expired' },
    cancelled: { th: 'ยกเลิกแล้ว', en: 'Cancelled' },
    pending_payment: { th: 'รอชำระเงิน', en: 'Pending Payment' },
  },

  // Payment Status
  paymentStatus: {
    pending: { th: 'รอดำเนินการ', en: 'Pending' },
    pending_approval: { th: 'รอการอนุมัติ', en: 'Pending Approval' },
    completed: { th: 'สำเร็จ', en: 'Completed' },
    failed: { th: 'ล้มเหลว', en: 'Failed' },
    refunded: { th: 'คืนเงินแล้ว', en: 'Refunded' },
    cancelled: { th: 'ยกเลิก', en: 'Cancelled' },
  },

  // Payment Methods
  paymentMethods: {
    stripe: { th: 'บัตรเครดิต/เดบิต', en: 'Credit/Debit Card' },
    bank_transfer: { th: 'โอนเงินธนาคาร', en: 'Bank Transfer' },
    manual: { th: 'ชำระด้วยตนเอง', en: 'Manual Payment' },
  },

  // Customer Details
  customer: {
    email: { th: 'อีเมล', en: 'Email' },
    phone: { th: 'เบอร์โทร', en: 'Phone' },
    restaurantName: { th: 'ชื่อร้าน', en: 'Restaurant Name' },
    branchCount: { th: 'จำนวนสาขา', en: 'Branches' },
    plan: { th: 'แพคเกจ', en: 'Plan' },
    status: { th: 'สถานะ', en: 'Status' },
    paymentMethod: { th: 'วิธีชำระเงิน', en: 'Payment Method' },
    nextBillingDate: { th: 'วันต่ออายุ', en: 'Next Billing Date' },
    trialEndsAt: { th: 'Trial หมดอายุ', en: 'Trial Ends' },
    createdAt: { th: 'วันที่สมัคร', en: 'Joined' },
    lastLogin: { th: 'เข้าสู่ระบบล่าสุด', en: 'Last Login' },
    address: { th: 'ที่อยู่', en: 'Address' },
    city: { th: 'เมือง', en: 'City' },
    country: { th: 'ประเทศ', en: 'Country' },
    totalOrders: { th: 'ออเดอร์ทั้งหมด', en: 'Total Orders' },
    totalRevenue: { th: 'รายได้ทั้งหมด', en: 'Total Revenue' },
    adminNotes: { th: 'หมายเหตุ Admin', en: 'Admin Notes' },
  },

  // Coupon
  coupon: {
    code: { th: 'รหัสคูปอง', en: 'Coupon Code' },
    name: { th: 'ชื่อคูปอง', en: 'Coupon Name' },
    description: { th: 'รายละเอียด', en: 'Description' },
    discountType: { th: 'ประเภทส่วนลด', en: 'Discount Type' },
    percentage: { th: 'เปอร์เซ็นต์', en: 'Percentage' },
    fixedAmount: { th: 'จำนวนเงิน', en: 'Fixed Amount' },
    discountValue: { th: 'มูลค่าส่วนลด', en: 'Discount Value' },
    usageLimit: { th: 'จำกัดการใช้', en: 'Usage Limit' },
    usageCount: { th: 'ใช้ไปแล้ว', en: 'Times Used' },
    startDate: { th: 'วันเริ่มต้น', en: 'Start Date' },
    endDate: { th: 'วันหมดอายุ', en: 'End Date' },
    isActive: { th: 'เปิดใช้งาน', en: 'Active' },
    appliesTo: { th: 'ใช้กับ', en: 'Applies To' },
    unlimited: { th: 'ไม่จำกัด', en: 'Unlimited' },
  },

  // Payment Approval
  approval: {
    pendingTitle: { th: 'รอการอนุมัติ', en: 'Pending Approval' },
    slipImage: { th: 'หลักฐานการโอน', en: 'Transfer Slip' },
    reference: { th: 'เลขอ้างอิง', en: 'Reference' },
    bankName: { th: 'ธนาคาร', en: 'Bank' },
    amount: { th: 'จำนวนเงิน', en: 'Amount' },
    submittedAt: { th: 'ส่งเมื่อ', en: 'Submitted' },
    approve: { th: 'อนุมัติ', en: 'Approve' },
    reject: { th: 'ปฏิเสธ', en: 'Reject' },
    approvalNotes: { th: 'หมายเหตุการอนุมัติ', en: 'Approval Notes' },
    rejectionReason: { th: 'เหตุผลที่ปฏิเสธ', en: 'Rejection Reason' },
    confirmApprove: { th: 'ยืนยันการอนุมัติ?', en: 'Confirm approval?' },
    confirmReject: { th: 'ยืนยันการปฏิเสธ?', en: 'Confirm rejection?' },
  },

  // Actions
  actions: {
    view: { th: 'ดู', en: 'View' },
    edit: { th: 'แก้ไข', en: 'Edit' },
    delete: { th: 'ลบ', en: 'Delete' },
    save: { th: 'บันทึก', en: 'Save' },
    cancel: { th: 'ยกเลิก', en: 'Cancel' },
    close: { th: 'ปิด', en: 'Close' },
    search: { th: 'ค้นหา', en: 'Search' },
    filter: { th: 'กรอง', en: 'Filter' },
    export: { th: 'ส่งออก', en: 'Export' },
    refresh: { th: 'รีเฟรช', en: 'Refresh' },
    backToDashboard: { th: 'กลับหน้าหลัก', en: 'Back to Dashboard' },
    viewAll: { th: 'ดูทั้งหมด', en: 'View All' },
    createCoupon: { th: 'สร้างคูปอง', en: 'Create Coupon' },
    extendSubscription: { th: 'ขยายเวลา', en: 'Extend Subscription' },
    changePlan: { th: 'เปลี่ยนแพคเกจ', en: 'Change Plan' },
    cancelSubscription: { th: 'ยกเลิก Subscription', en: 'Cancel Subscription' },
  },

  // Notifications
  notifications: {
    title: { th: 'การแจ้งเตือน', en: 'Notifications' },
    pendingPayments: { th: 'การชำระเงินรอการอนุมัติ', en: 'Payments Pending Approval' },
    expiringTrials: { th: 'Trial ใกล้หมดอายุ', en: 'Trials Expiring Soon' },
    expiringSubscriptions: { th: 'Subscription ใกล้หมดอายุ', en: 'Subscriptions Expiring' },
    newUsers: { th: 'ผู้ใช้ใหม่', en: 'New Users' },
  },

  // Messages
  messages: {
    noData: { th: 'ไม่พบข้อมูล', en: 'No data found' },
    loading: { th: 'กำลังโหลด...', en: 'Loading...' },
    success: { th: 'สำเร็จ', en: 'Success' },
    error: { th: 'เกิดข้อผิดพลาด', en: 'Error occurred' },
    confirmDelete: { th: 'ยืนยันการลบ?', en: 'Confirm delete?' },
    saved: { th: 'บันทึกแล้ว', en: 'Saved' },
    paymentApproved: { th: 'อนุมัติการชำระเงินแล้ว', en: 'Payment approved' },
    paymentRejected: { th: 'ปฏิเสธการชำระเงินแล้ว', en: 'Payment rejected' },
    subscriptionExtended: { th: 'ขยายเวลา Subscription แล้ว', en: 'Subscription extended' },
    planChanged: { th: 'เปลี่ยนแพคเกจแล้ว', en: 'Plan changed' },
    subscriptionCancelled: { th: 'ยกเลิก Subscription แล้ว', en: 'Subscription cancelled' },
    couponCreated: { th: 'สร้างคูปองแล้ว', en: 'Coupon created' },
    couponUpdated: { th: 'อัพเดทคูปองแล้ว', en: 'Coupon updated' },
    couponDeleted: { th: 'ลบคูปองแล้ว', en: 'Coupon deleted' },
  },

  // Time
  time: {
    today: { th: 'วันนี้', en: 'Today' },
    yesterday: { th: 'เมื่อวาน', en: 'Yesterday' },
    daysAgo: { th: 'วันที่แล้ว', en: 'days ago' },
    daysRemaining: { th: 'วันที่เหลือ', en: 'days remaining' },
    expired: { th: 'หมดอายุแล้ว', en: 'Expired' },
  },

  // Reports
  reports: {
    title: { th: 'รายงาน', en: 'Reports' },
    revenueReport: { th: 'รายงานรายได้', en: 'Revenue Report' },
    subscriptionReport: { th: 'รายงาน Subscription', en: 'Subscription Report' },
    period: { th: 'ช่วงเวลา', en: 'Period' },
    day: { th: 'วันนี้', en: 'Today' },
    week: { th: 'สัปดาห์นี้', en: 'This Week' },
    month: { th: 'เดือนนี้', en: 'This Month' },
    year: { th: 'ปีนี้', en: 'This Year' },
    totalRevenue: { th: 'รายได้รวม', en: 'Total Revenue' },
    byPlan: { th: 'ตามแพคเกจ', en: 'By Plan' },
    byPaymentMethod: { th: 'ตามวิธีชำระ', en: 'By Payment Method' },
  },
};

// Helper function to get translation
export function t(key: string, lang: AdminLanguage = 'en'): string {
  const keys = key.split('.');
  let value: any = adminTranslations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Return key if not found
    }
  }

  if (value && typeof value === 'object' && lang in value) {
    return value[lang];
  }

  return key;
}

// Format date based on language
export function formatDate(date: string | Date, lang: AdminLanguage = 'en'): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  if (lang === 'th') {
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return d.toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'NZD'): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Get status badge color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    trial: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    pending_payment: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-yellow-100 text-yellow-800',
    pending_approval: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-purple-100 text-purple-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

// Get plan badge color
export function getPlanColor(plan: string): string {
  const colors: Record<string, string> = {
    free_trial: 'bg-gray-100 text-gray-800',
    starter: 'bg-blue-100 text-blue-800',
    professional: 'bg-purple-100 text-purple-800',
    enterprise: 'bg-orange-100 text-orange-800',
    admin: 'bg-red-100 text-red-800',
  };
  return colors[plan] || 'bg-gray-100 text-gray-800';
}
