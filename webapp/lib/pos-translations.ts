// POS System Translations - All 12 Languages with English subtitle support

export type POSLanguage = 'th' | 'en' | 'zh' | 'ja' | 'ko' | 'vi' | 'hi' | 'es' | 'fr' | 'de' | 'id' | 'ms';

// All translations for POS system
export const posTranslations = {
  // POS Login Page
  login: {
    title: {
      th: 'Smart Menu POS', en: 'Smart Menu POS', zh: 'Smart Menu POS',
      ja: 'Smart Menu POS', ko: 'Smart Menu POS', vi: 'Smart Menu POS',
      hi: 'Smart Menu POS', es: 'Smart Menu POS', fr: 'Smart Menu POS',
      de: 'Smart Menu POS', id: 'Smart Menu POS', ms: 'Smart Menu POS'
    },
    staffMode: {
      th: 'พนักงาน', en: 'Staff', zh: '员工',
      ja: 'スタッフ', ko: '직원', vi: 'Nhân viên',
      hi: 'कर्मचारी', es: 'Personal', fr: 'Personnel',
      de: 'Personal', id: 'Staf', ms: 'Kakitangan'
    },
    kitchenMode: {
      th: 'ครัว', en: 'Kitchen', zh: '厨房',
      ja: 'キッチン', ko: '주방', vi: 'Bếp',
      hi: 'रसोई', es: 'Cocina', fr: 'Cuisine',
      de: 'Küche', id: 'Dapur', ms: 'Dapur'
    },
    staffSystem: {
      th: 'ระบบพนักงาน', en: 'Staff System', zh: '员工系统',
      ja: 'スタッフシステム', ko: '직원 시스템', vi: 'Hệ thống nhân viên',
      hi: 'कर्मचारी प्रणाली', es: 'Sistema de personal', fr: 'Système du personnel',
      de: 'Personalsystem', id: 'Sistem Staf', ms: 'Sistem Kakitangan'
    },
    kitchenSystem: {
      th: 'ระบบครัว', en: 'Kitchen System', zh: '厨房系统',
      ja: 'キッチンシステム', ko: '주방 시스템', vi: 'Hệ thống bếp',
      hi: 'रसोई प्रणाली', es: 'Sistema de cocina', fr: 'Système de cuisine',
      de: 'Küchensystem', id: 'Sistem Dapur', ms: 'Sistem Dapur'
    },
    selectRestaurant: {
      th: 'เลือกร้านอาหาร', en: 'Select Restaurant', zh: '选择餐厅',
      ja: 'レストランを選択', ko: '레스토랑 선택', vi: 'Chọn nhà hàng',
      hi: 'रेस्तरां चुनें', es: 'Seleccionar restaurante', fr: 'Sélectionner le restaurant',
      de: 'Restaurant auswählen', id: 'Pilih Restoran', ms: 'Pilih Restoran'
    },
    restaurantCode: {
      th: 'รหัสร้าน', en: 'Restaurant Code', zh: '餐厅代码',
      ja: 'レストランコード', ko: '레스토랑 코드', vi: 'Mã nhà hàng',
      hi: 'रेस्तरां कोड', es: 'Código del restaurante', fr: 'Code du restaurant',
      de: 'Restaurantcode', id: 'Kode Restoran', ms: 'Kod Restoran'
    },
    restaurantPlaceholder: {
      th: 'เช่น thai-smile', en: 'e.g. thai-smile', zh: '例如 thai-smile',
      ja: '例: thai-smile', ko: '예: thai-smile', vi: 'VD: thai-smile',
      hi: 'जैसे thai-smile', es: 'ej. thai-smile', fr: 'ex. thai-smile',
      de: 'z.B. thai-smile', id: 'cth. thai-smile', ms: 'cth. thai-smile'
    },
    next: {
      th: 'ถัดไป', en: 'Next', zh: '下一步',
      ja: '次へ', ko: '다음', vi: 'Tiếp theo',
      hi: 'अगला', es: 'Siguiente', fr: 'Suivant',
      de: 'Weiter', id: 'Lanjut', ms: 'Seterusnya'
    },
    restaurant: {
      th: 'ร้าน', en: 'Restaurant', zh: '餐厅',
      ja: 'レストラン', ko: '레스토랑', vi: 'Nhà hàng',
      hi: 'रेस्तरां', es: 'Restaurante', fr: 'Restaurant',
      de: 'Restaurant', id: 'Restoran', ms: 'Restoran'
    },
    changeRestaurant: {
      th: 'เปลี่ยนร้าน', en: 'Change', zh: '更换',
      ja: '変更', ko: '변경', vi: 'Đổi',
      hi: 'बदलें', es: 'Cambiar', fr: 'Changer',
      de: 'Ändern', id: 'Ganti', ms: 'Tukar'
    },
    pinCode: {
      th: 'รหัส PIN', en: 'PIN Code', zh: 'PIN码',
      ja: 'PINコード', ko: 'PIN 코드', vi: 'Mã PIN',
      hi: 'PIN कोड', es: 'Código PIN', fr: 'Code PIN',
      de: 'PIN-Code', id: 'Kode PIN', ms: 'Kod PIN'
    },
    enter: {
      th: 'เข้าสู่ระบบ', en: 'Enter', zh: '确认',
      ja: '入力', ko: '입력', vi: 'Nhập',
      hi: 'दर्ज करें', es: 'Entrar', fr: 'Entrer',
      de: 'Eingeben', id: 'Masuk', ms: 'Masuk'
    },
    loggingIn: {
      th: 'กำลังเข้าสู่ระบบ...', en: 'Logging in...', zh: '登录中...',
      ja: 'ログイン中...', ko: '로그인 중...', vi: 'Đang đăng nhập...',
      hi: 'लॉग इन हो रहा है...', es: 'Iniciando sesión...', fr: 'Connexion...',
      de: 'Anmeldung...', id: 'Masuk...', ms: 'Log masuk...'
    },
    invalidPin: {
      th: 'PIN ไม่ถูกต้อง', en: 'Invalid PIN', zh: 'PIN码无效',
      ja: '無効なPIN', ko: '잘못된 PIN', vi: 'PIN không hợp lệ',
      hi: 'अमान्य PIN', es: 'PIN inválido', fr: 'PIN invalide',
      de: 'Ungültige PIN', id: 'PIN tidak valid', ms: 'PIN tidak sah'
    },
    restaurantNotFound: {
      th: 'ไม่พบร้านอาหาร', en: 'Restaurant not found', zh: '未找到餐厅',
      ja: 'レストランが見つかりません', ko: '레스토랑을 찾을 수 없음', vi: 'Không tìm thấy nhà hàng',
      hi: 'रेस्तरां नहीं मिला', es: 'Restaurante no encontrado', fr: 'Restaurant non trouvé',
      de: 'Restaurant nicht gefunden', id: 'Restoran tidak ditemukan', ms: 'Restoran tidak dijumpai'
    },
    enterRestaurantCode: {
      th: 'กรุณากรอกรหัสร้าน', en: 'Please enter restaurant code', zh: '请输入餐厅代码',
      ja: 'レストランコードを入力してください', ko: '레스토랑 코드를 입력하세요', vi: 'Vui lòng nhập mã nhà hàng',
      hi: 'कृपया रेस्तरां कोड दर्ज करें', es: 'Ingrese el código del restaurante', fr: 'Veuillez entrer le code du restaurant',
      de: 'Bitte Restaurantcode eingeben', id: 'Masukkan kode restoran', ms: 'Sila masukkan kod restoran'
    },
    error: {
      th: 'เกิดข้อผิดพลาด', en: 'An error occurred', zh: '发生错误',
      ja: 'エラーが発生しました', ko: '오류가 발생했습니다', vi: 'Đã xảy ra lỗi',
      hi: 'एक त्रुटि हुई', es: 'Ocurrió un error', fr: 'Une erreur est survenue',
      de: 'Ein Fehler ist aufgetreten', id: 'Terjadi kesalahan', ms: 'Ralat berlaku'
    },
  },

  // Kitchen Display
  kitchen: {
    title: {
      th: 'หน้าจอครัว', en: 'Kitchen Display', zh: '厨房显示',
      ja: 'キッチンディスプレイ', ko: '주방 디스플레이', vi: 'Màn hình bếp',
      hi: 'रसोई डिस्प्ले', es: 'Pantalla de cocina', fr: 'Écran cuisine',
      de: 'Küchenanzeige', id: 'Tampilan Dapur', ms: 'Paparan Dapur'
    },
    staff: {
      th: 'พนักงาน', en: 'Staff', zh: '员工',
      ja: 'スタッフ', ko: '직원', vi: 'Nhân viên',
      hi: 'कर्मचारी', es: 'Personal', fr: 'Personnel',
      de: 'Personal', id: 'Staf', ms: 'Kakitangan'
    },
    noOrders: {
      th: 'ไม่มีออเดอร์', en: 'No orders', zh: '暂无订单',
      ja: '注文なし', ko: '주문 없음', vi: 'Không có đơn',
      hi: 'कोई ऑर्डर नहीं', es: 'Sin pedidos', fr: 'Aucune commande',
      de: 'Keine Bestellungen', id: 'Tidak ada pesanan', ms: 'Tiada pesanan'
    },
    pending: {
      th: 'รอทำ', en: 'Pending', zh: '待处理',
      ja: '保留中', ko: '대기 중', vi: 'Đang chờ',
      hi: 'लंबित', es: 'Pendiente', fr: 'En attente',
      de: 'Ausstehend', id: 'Menunggu', ms: 'Menunggu'
    },
    cooking: {
      th: 'กำลังทำ', en: 'Cooking', zh: '制作中',
      ja: '調理中', ko: '조리 중', vi: 'Đang nấu',
      hi: 'पक रहा है', es: 'Cocinando', fr: 'En préparation',
      de: 'Wird zubereitet', id: 'Memasak', ms: 'Memasak'
    },
    ready: {
      th: 'พร้อมเสิร์ฟ', en: 'Ready', zh: '已完成',
      ja: '準備完了', ko: '준비 완료', vi: 'Sẵn sàng',
      hi: 'तैयार', es: 'Listo', fr: 'Prêt',
      de: 'Fertig', id: 'Siap', ms: 'Sedia'
    },
    served: {
      th: 'เสิร์ฟแล้ว', en: 'Served', zh: '已上菜',
      ja: '提供済み', ko: '서빙 완료', vi: 'Đã phục vụ',
      hi: 'परोसा गया', es: 'Servido', fr: 'Servi',
      de: 'Serviert', id: 'Disajikan', ms: 'Dihidang'
    },
    startCooking: {
      th: 'เริ่มทำ', en: 'Start', zh: '开始',
      ja: '開始', ko: '시작', vi: 'Bắt đầu',
      hi: 'शुरू करें', es: 'Iniciar', fr: 'Démarrer',
      de: 'Starten', id: 'Mulai', ms: 'Mula'
    },
    markReady: {
      th: 'เสร็จแล้ว', en: 'Done', zh: '完成',
      ja: '完了', ko: '완료', vi: 'Xong',
      hi: 'हो गया', es: 'Hecho', fr: 'Terminé',
      de: 'Fertig', id: 'Selesai', ms: 'Siap'
    },
    markServed: {
      th: 'เสิร์ฟแล้ว', en: 'Served', zh: '已上菜',
      ja: '提供済み', ko: '서빙됨', vi: 'Đã phục vụ',
      hi: 'परोसा गया', es: 'Servido', fr: 'Servi',
      de: 'Serviert', id: 'Disajikan', ms: 'Dihidang'
    },
    table: {
      th: 'โต๊ะ', en: 'Table', zh: '桌号',
      ja: 'テーブル', ko: '테이블', vi: 'Bàn',
      hi: 'टेबल', es: 'Mesa', fr: 'Table',
      de: 'Tisch', id: 'Meja', ms: 'Meja'
    },
    pickup: {
      th: 'รับเอง', en: 'Pickup', zh: '自取',
      ja: 'テイクアウト', ko: '픽업', vi: 'Tự lấy',
      hi: 'पिकअप', es: 'Recoger', fr: 'À emporter',
      de: 'Abholung', id: 'Ambil sendiri', ms: 'Ambil sendiri'
    },
    delivery: {
      th: 'จัดส่ง', en: 'Delivery', zh: '外卖',
      ja: '配達', ko: '배달', vi: 'Giao hàng',
      hi: 'डिलीवरी', es: 'Entrega', fr: 'Livraison',
      de: 'Lieferung', id: 'Antar', ms: 'Penghantaran'
    },
    minutes: {
      th: 'นาที', en: 'min', zh: '分钟',
      ja: '分', ko: '분', vi: 'phút',
      hi: 'मिनट', es: 'min', fr: 'min',
      de: 'Min', id: 'mnt', ms: 'min'
    },
    hours: {
      th: 'ชม.', en: 'hr', zh: '小时',
      ja: '時間', ko: '시간', vi: 'giờ',
      hi: 'घंटा', es: 'hr', fr: 'h',
      de: 'Std', id: 'jam', ms: 'jam'
    },
    justNow: {
      th: 'เพิ่งเข้า', en: 'Just now', zh: '刚刚',
      ja: 'たった今', ko: '방금', vi: 'Vừa xong',
      hi: 'अभी', es: 'Ahora', fr: 'À l\'instant',
      de: 'Gerade eben', id: 'Baru saja', ms: 'Baru sahaja'
    },
    logout: {
      th: 'ออก', en: 'Logout', zh: '退出',
      ja: 'ログアウト', ko: '로그아웃', vi: 'Đăng xuất',
      hi: 'लॉग आउट', es: 'Salir', fr: 'Déconnexion',
      de: 'Abmelden', id: 'Keluar', ms: 'Log keluar'
    },
    waitingForOrders: {
      th: 'รอออเดอร์ใหม่...', en: 'Waiting for orders...', zh: '等待新订单...',
      ja: '注文待機中...', ko: '주문 대기 중...', vi: 'Đang chờ đơn hàng...',
      hi: 'ऑर्डर का इंतजार...', es: 'Esperando pedidos...', fr: 'En attente de commandes...',
      de: 'Warte auf Bestellungen...', id: 'Menunggu pesanan...', ms: 'Menunggu pesanan...'
    },
  },

  // Staff Orders Display
  orders: {
    title: {
      th: 'หน้าจอพนักงาน', en: 'Staff Display', zh: '员工显示',
      ja: 'スタッフディスプレイ', ko: '직원 디스플레이', vi: 'Màn hình nhân viên',
      hi: 'कर्मचारी डिस्प्ले', es: 'Pantalla de personal', fr: 'Écran personnel',
      de: 'Personalanzeige', id: 'Tampilan Staf', ms: 'Paparan Kakitangan'
    },
    ordersTab: {
      th: 'ออเดอร์', en: 'Orders', zh: '订单',
      ja: '注文', ko: '주문', vi: 'Đơn hàng',
      hi: 'ऑर्डर', es: 'Pedidos', fr: 'Commandes',
      de: 'Bestellungen', id: 'Pesanan', ms: 'Pesanan'
    },
    requestsTab: {
      th: 'การเรียก', en: 'Requests', zh: '呼叫',
      ja: 'リクエスト', ko: '요청', vi: 'Yêu cầu',
      hi: 'अनुरोध', es: 'Solicitudes', fr: 'Demandes',
      de: 'Anfragen', id: 'Permintaan', ms: 'Permintaan'
    },
    noOrders: {
      th: 'ไม่มีออเดอร์', en: 'No orders', zh: '暂无订单',
      ja: '注文なし', ko: '주문 없음', vi: 'Không có đơn',
      hi: 'कोई ऑर्डर नहीं', es: 'Sin pedidos', fr: 'Aucune commande',
      de: 'Keine Bestellungen', id: 'Tidak ada pesanan', ms: 'Tiada pesanan'
    },
    noRequests: {
      th: 'ไม่มีการเรียก', en: 'No requests', zh: '暂无呼叫',
      ja: 'リクエストなし', ko: '요청 없음', vi: 'Không có yêu cầu',
      hi: 'कोई अनुरोध नहीं', es: 'Sin solicitudes', fr: 'Aucune demande',
      de: 'Keine Anfragen', id: 'Tidak ada permintaan', ms: 'Tiada permintaan'
    },
    pending: {
      th: 'รอยืนยัน', en: 'Pending', zh: '待确认',
      ja: '確認待ち', ko: '확인 대기', vi: 'Đang chờ',
      hi: 'लंबित', es: 'Pendiente', fr: 'En attente',
      de: 'Ausstehend', id: 'Menunggu', ms: 'Menunggu'
    },
    confirmed: {
      th: 'ยืนยันแล้ว', en: 'Confirmed', zh: '已确认',
      ja: '確認済み', ko: '확인됨', vi: 'Đã xác nhận',
      hi: 'पुष्टि', es: 'Confirmado', fr: 'Confirmé',
      de: 'Bestätigt', id: 'Dikonfirmasi', ms: 'Disahkan'
    },
    preparing: {
      th: 'กำลังทำ', en: 'Preparing', zh: '制作中',
      ja: '準備中', ko: '준비 중', vi: 'Đang chuẩn bị',
      hi: 'तैयारी', es: 'Preparando', fr: 'En préparation',
      de: 'In Zubereitung', id: 'Menyiapkan', ms: 'Menyediakan'
    },
    ready: {
      th: 'พร้อมเสิร์ฟ', en: 'Ready', zh: '已完成',
      ja: '準備完了', ko: '준비 완료', vi: 'Sẵn sàng',
      hi: 'तैयार', es: 'Listo', fr: 'Prêt',
      de: 'Fertig', id: 'Siap', ms: 'Sedia'
    },
    completed: {
      th: 'เสร็จสิ้น', en: 'Completed', zh: '已完成',
      ja: '完了', ko: '완료', vi: 'Hoàn thành',
      hi: 'पूर्ण', es: 'Completado', fr: 'Terminé',
      de: 'Abgeschlossen', id: 'Selesai', ms: 'Selesai'
    },
    served: {
      th: 'เสิร์ฟแล้ว', en: 'Served', zh: '已上菜',
      ja: '提供済み', ko: '서빙됨', vi: 'Đã phục vụ',
      hi: 'परोसा गया', es: 'Servido', fr: 'Servi',
      de: 'Serviert', id: 'Disajikan', ms: 'Dihidang'
    },
    complete: {
      th: 'เสร็จสิ้น', en: 'Complete', zh: '完成',
      ja: '完了', ko: '완료', vi: 'Hoàn thành',
      hi: 'पूर्ण', es: 'Completar', fr: 'Terminer',
      de: 'Abschließen', id: 'Selesai', ms: 'Selesai'
    },
    table: {
      th: 'โต๊ะ', en: 'Table', zh: '桌号',
      ja: 'テーブル', ko: '테이블', vi: 'Bàn',
      hi: 'टेबल', es: 'Mesa', fr: 'Table',
      de: 'Tisch', id: 'Meja', ms: 'Meja'
    },
    callWaiter: {
      th: 'เรียกพนักงาน', en: 'Call Waiter', zh: '呼叫服务员',
      ja: 'ウェイターを呼ぶ', ko: '웨이터 호출', vi: 'Gọi phục vụ',
      hi: 'वेटर को बुलाओ', es: 'Llamar camarero', fr: 'Appeler serveur',
      de: 'Kellner rufen', id: 'Panggil pelayan', ms: 'Panggil pelayan'
    },
    requestSauce: {
      th: 'ขอซอส', en: 'Request Sauce', zh: '要酱料',
      ja: 'ソースを頼む', ko: '소스 요청', vi: 'Yêu cầu nước sốt',
      hi: 'सॉस चाहिए', es: 'Pedir salsa', fr: 'Demander sauce',
      de: 'Soße anfordern', id: 'Minta saus', ms: 'Minta sos'
    },
    requestWater: {
      th: 'ขอน้ำ', en: 'Request Water', zh: '要水',
      ja: '水を頼む', ko: '물 요청', vi: 'Yêu cầu nước',
      hi: 'पानी चाहिए', es: 'Pedir agua', fr: 'Demander eau',
      de: 'Wasser anfordern', id: 'Minta air', ms: 'Minta air'
    },
    requestBill: {
      th: 'ขอบิล', en: 'Request Bill', zh: '要账单',
      ja: '会計を頼む', ko: '계산서 요청', vi: 'Yêu cầu hóa đơn',
      hi: 'बिल चाहिए', es: 'Pedir cuenta', fr: 'Demander l\'addition',
      de: 'Rechnung anfordern', id: 'Minta tagihan', ms: 'Minta bil'
    },
    other: {
      th: 'อื่นๆ', en: 'Other', zh: '其他',
      ja: 'その他', ko: '기타', vi: 'Khác',
      hi: 'अन्य', es: 'Otro', fr: 'Autre',
      de: 'Sonstiges', id: 'Lainnya', ms: 'Lain-lain'
    },
    pendingAction: {
      th: 'รอดำเนินการ', en: 'Pending', zh: '待处理',
      ja: '対応待ち', ko: '처리 대기', vi: 'Đang chờ',
      hi: 'लंबित', es: 'Pendiente', fr: 'En attente',
      de: 'Ausstehend', id: 'Menunggu', ms: 'Menunggu'
    },
    acknowledged: {
      th: 'รับทราบแล้ว', en: 'Acknowledged', zh: '已确认',
      ja: '確認済み', ko: '확인됨', vi: 'Đã xác nhận',
      hi: 'स्वीकृत', es: 'Reconocido', fr: 'Accusé',
      de: 'Bestätigt', id: 'Diakui', ms: 'Diakui'
    },
    acknowledge: {
      th: 'รับทราบ', en: 'Acknowledge', zh: '确认',
      ja: '確認', ko: '확인', vi: 'Xác nhận',
      hi: 'स्वीकार', es: 'Reconocer', fr: 'Accuser',
      de: 'Bestätigen', id: 'Akui', ms: 'Akui'
    },
    minutes: {
      th: 'นาที', en: 'min', zh: '分钟',
      ja: '分', ko: '분', vi: 'phút',
      hi: 'मिनट', es: 'min', fr: 'min',
      de: 'Min', id: 'mnt', ms: 'min'
    },
    hours: {
      th: 'ชม.', en: 'hr', zh: '小时',
      ja: '時間', ko: '시간', vi: 'giờ',
      hi: 'घंटा', es: 'hr', fr: 'h',
      de: 'Std', id: 'jam', ms: 'jam'
    },
    justNow: {
      th: 'เพิ่งเข้า', en: 'Just now', zh: '刚刚',
      ja: 'たった今', ko: '방금', vi: 'Vừa xong',
      hi: 'अभी', es: 'Ahora', fr: 'À l\'instant',
      de: 'Gerade eben', id: 'Baru saja', ms: 'Baru sahaja'
    },
    logout: {
      th: 'ออก', en: 'Logout', zh: '退出',
      ja: 'ログアウト', ko: '로그아웃', vi: 'Đăng xuất',
      hi: 'लॉग आउट', es: 'Salir', fr: 'Déconnexion',
      de: 'Abmelden', id: 'Keluar', ms: 'Log keluar'
    },
  },

  // Cashier Dashboard
  cashier: {
    dailyReport: {
      th: 'รายงานประจำวัน', en: 'Daily Report', zh: '每日报告',
      ja: '日報', ko: '일일 보고서', vi: 'Báo cáo hàng ngày',
      hi: 'दैनिक रिपोर्ट', es: 'Informe diario', fr: 'Rapport quotidien',
      de: 'Tagesbericht', id: 'Laporan Harian', ms: 'Laporan Harian'
    },
    refresh: {
      th: 'รีเฟรช', en: 'Refresh', zh: '刷新',
      ja: '更新', ko: '새로고침', vi: 'Làm mới',
      hi: 'रीफ्रेश', es: 'Actualizar', fr: 'Actualiser',
      de: 'Aktualisieren', id: 'Segarkan', ms: 'Muat semula'
    },
    preview: {
      th: 'ดูตัวอย่าง', en: 'Preview', zh: '预览',
      ja: 'プレビュー', ko: '미리보기', vi: 'Xem trước',
      hi: 'पूर्वावलोकन', es: 'Vista previa', fr: 'Aperçu',
      de: 'Vorschau', id: 'Pratinjau', ms: 'Pratonton'
    },
    print: {
      th: 'พิมพ์', en: 'Print', zh: '打印',
      ja: '印刷', ko: '인쇄', vi: 'In',
      hi: 'प्रिंट', es: 'Imprimir', fr: 'Imprimer',
      de: 'Drucken', id: 'Cetak', ms: 'Cetak'
    },
    totalOrders: {
      th: 'ออเดอร์ทั้งหมด', en: 'Total Orders', zh: '总订单',
      ja: '総注文数', ko: '총 주문', vi: 'Tổng đơn hàng',
      hi: 'कुल ऑर्डर', es: 'Pedidos totales', fr: 'Total commandes',
      de: 'Gesamtbestellungen', id: 'Total Pesanan', ms: 'Jumlah Pesanan'
    },
    completed: {
      th: 'สำเร็จ', en: 'Completed', zh: '已完成',
      ja: '完了', ko: '완료', vi: 'Hoàn thành',
      hi: 'पूर्ण', es: 'Completado', fr: 'Terminé',
      de: 'Abgeschlossen', id: 'Selesai', ms: 'Selesai'
    },
    voided: {
      th: 'ยกเลิก', en: 'Voided', zh: '已取消',
      ja: 'キャンセル', ko: '취소됨', vi: 'Đã hủy',
      hi: 'रद्द', es: 'Anulado', fr: 'Annulé',
      de: 'Storniert', id: 'Dibatalkan', ms: 'Dibatalkan'
    },
    pendingPayment: {
      th: 'รอชำระเงิน', en: 'Pending Payment', zh: '待付款',
      ja: '支払い待ち', ko: '결제 대기', vi: 'Chờ thanh toán',
      hi: 'भुगतान लंबित', es: 'Pago pendiente', fr: 'Paiement en attente',
      de: 'Zahlung ausstehend', id: 'Menunggu Pembayaran', ms: 'Menunggu Pembayaran'
    },
    totalRevenue: {
      th: 'รายได้รวม', en: 'Total Revenue', zh: '总收入',
      ja: '総収益', ko: '총 수익', vi: 'Tổng doanh thu',
      hi: 'कुल राजस्व', es: 'Ingresos totales', fr: 'Revenu total',
      de: 'Gesamtumsatz', id: 'Total Pendapatan', ms: 'Jumlah Hasil'
    },
    revenueByPayment: {
      th: 'รายได้ตามวิธีชำระเงิน', en: 'Revenue by Payment Method', zh: '按支付方式的收入',
      ja: '支払い方法別収益', ko: '결제 방법별 수익', vi: 'Doanh thu theo phương thức thanh toán',
      hi: 'भुगतान विधि द्वारा राजस्व', es: 'Ingresos por método de pago', fr: 'Revenus par mode de paiement',
      de: 'Umsatz nach Zahlungsmethode', id: 'Pendapatan per Metode Pembayaran', ms: 'Hasil mengikut Kaedah Pembayaran'
    },
    creditDebit: {
      th: 'บัตรเครดิต/เดบิต', en: 'Credit/Debit', zh: '信用卡/借记卡',
      ja: 'クレジット/デビット', ko: '신용/직불', vi: 'Thẻ tín dụng/ghi nợ',
      hi: 'क्रेडिट/डेबिट', es: 'Crédito/Débito', fr: 'Crédit/Débit',
      de: 'Kredit/Debit', id: 'Kredit/Debit', ms: 'Kredit/Debit'
    },
    bankTransfer: {
      th: 'โอนเงิน', en: 'Bank Transfer', zh: '银行转账',
      ja: '銀行振込', ko: '계좌이체', vi: 'Chuyển khoản',
      hi: 'बैंक ट्रांसफर', es: 'Transferencia bancaria', fr: 'Virement bancaire',
      de: 'Banküberweisung', id: 'Transfer Bank', ms: 'Pindahan Bank'
    },
    cashAtCounter: {
      th: 'เงินสด', en: 'Cash at Counter', zh: '现金',
      ja: '現金', ko: '현금', vi: 'Tiền mặt',
      hi: 'नकद', es: 'Efectivo', fr: 'Espèces',
      de: 'Bargeld', id: 'Tunai', ms: 'Tunai'
    },
    unpaid: {
      th: 'ยังไม่ชำระ', en: 'Unpaid', zh: '未付款',
      ja: '未払い', ko: '미결제', vi: 'Chưa thanh toán',
      hi: 'अवैतनिक', es: 'Sin pagar', fr: 'Impayé',
      de: 'Unbezahlt', id: 'Belum Dibayar', ms: 'Belum Dibayar'
    },
    voidedOrders: {
      th: 'ออเดอร์ที่ยกเลิก', en: 'Voided Orders', zh: '已取消订单',
      ja: 'キャンセル注文', ko: '취소된 주문', vi: 'Đơn hàng đã hủy',
      hi: 'रद्द ऑर्डर', es: 'Pedidos anulados', fr: 'Commandes annulées',
      de: 'Stornierte Bestellungen', id: 'Pesanan Dibatalkan', ms: 'Pesanan Dibatalkan'
    },
    allOrders: {
      th: 'ออเดอร์ทั้งหมด', en: 'All Orders', zh: '所有订单',
      ja: '全注文', ko: '전체 주문', vi: 'Tất cả đơn hàng',
      hi: 'सभी ऑर्डर', es: 'Todos los pedidos', fr: 'Toutes les commandes',
      de: 'Alle Bestellungen', id: 'Semua Pesanan', ms: 'Semua Pesanan'
    },
    completedOrders: {
      th: 'ออเดอร์สำเร็จ', en: 'Completed Orders', zh: '已完成订单',
      ja: '完了注文', ko: '완료된 주문', vi: 'Đơn hàng hoàn thành',
      hi: 'पूर्ण ऑर्डर', es: 'Pedidos completados', fr: 'Commandes terminées',
      de: 'Abgeschlossene Bestellungen', id: 'Pesanan Selesai', ms: 'Pesanan Selesai'
    },
    reason: {
      th: 'เหตุผล', en: 'Reason', zh: '原因',
      ja: '理由', ko: '사유', vi: 'Lý do',
      hi: 'कारण', es: 'Razón', fr: 'Raison',
      de: 'Grund', id: 'Alasan', ms: 'Sebab'
    },
    orderId: {
      th: 'เลขออเดอร์', en: 'Order ID', zh: '订单号',
      ja: '注文ID', ko: '주문 ID', vi: 'Mã đơn hàng',
      hi: 'ऑर्डर ID', es: 'ID de pedido', fr: 'ID commande',
      de: 'Bestell-ID', id: 'ID Pesanan', ms: 'ID Pesanan'
    },
    table: {
      th: 'โต๊ะ', en: 'Table', zh: '桌号',
      ja: 'テーブル', ko: '테이블', vi: 'Bàn',
      hi: 'टेबल', es: 'Mesa', fr: 'Table',
      de: 'Tisch', id: 'Meja', ms: 'Meja'
    },
    customer: {
      th: 'ลูกค้า', en: 'Customer', zh: '顾客',
      ja: '顧客', ko: '고객', vi: 'Khách hàng',
      hi: 'ग्राहक', es: 'Cliente', fr: 'Client',
      de: 'Kunde', id: 'Pelanggan', ms: 'Pelanggan'
    },
    amount: {
      th: 'จำนวนเงิน', en: 'Amount', zh: '金额',
      ja: '金額', ko: '금액', vi: 'Số tiền',
      hi: 'राशि', es: 'Monto', fr: 'Montant',
      de: 'Betrag', id: 'Jumlah', ms: 'Jumlah'
    },
    status: {
      th: 'สถานะ', en: 'Status', zh: '状态',
      ja: 'ステータス', ko: '상태', vi: 'Trạng thái',
      hi: 'स्थिति', es: 'Estado', fr: 'Statut',
      de: 'Status', id: 'Status', ms: 'Status'
    },
    noOrders: {
      th: 'ไม่มีออเดอร์', en: 'No orders', zh: '暂无订单',
      ja: '注文なし', ko: '주문 없음', vi: 'Không có đơn hàng',
      hi: 'कोई ऑर्डर नहीं', es: 'Sin pedidos', fr: 'Aucune commande',
      de: 'Keine Bestellungen', id: 'Tidak ada pesanan', ms: 'Tiada pesanan'
    },
    noData: {
      th: 'ไม่มีข้อมูล', en: 'No data available', zh: '暂无数据',
      ja: 'データなし', ko: '데이터 없음', vi: 'Không có dữ liệu',
      hi: 'कोई डेटा नहीं', es: 'Sin datos', fr: 'Aucune donnée',
      de: 'Keine Daten', id: 'Tidak ada data', ms: 'Tiada data'
    },
    dineIn: {
      th: 'ทานที่ร้าน', en: 'Dine In', zh: '堂食',
      ja: '店内', ko: '매장 식사', vi: 'Ăn tại chỗ',
      hi: 'डाइन इन', es: 'Comer aquí', fr: 'Sur place',
      de: 'Vor Ort', id: 'Makan di tempat', ms: 'Makan di sini'
    },
    pickup: {
      th: 'รับเอง', en: 'Pickup', zh: '自取',
      ja: 'テイクアウト', ko: '픽업', vi: 'Tự lấy',
      hi: 'पिकअप', es: 'Recoger', fr: 'À emporter',
      de: 'Abholung', id: 'Ambil sendiri', ms: 'Ambil sendiri'
    },
    delivery: {
      th: 'จัดส่ง', en: 'Delivery', zh: '外卖',
      ja: '配達', ko: '배달', vi: 'Giao hàng',
      hi: 'डिलीवरी', es: 'Entrega', fr: 'Livraison',
      de: 'Lieferung', id: 'Antar', ms: 'Penghantaran'
    },
    paid: {
      th: 'ชำระแล้ว', en: 'Paid', zh: '已付款',
      ja: '支払い済み', ko: '결제 완료', vi: 'Đã thanh toán',
      hi: 'भुगतान किया', es: 'Pagado', fr: 'Payé',
      de: 'Bezahlt', id: 'Dibayar', ms: 'Dibayar'
    },
    pending: {
      th: 'รอดำเนินการ', en: 'Pending', zh: '待处理',
      ja: '保留中', ko: '대기 중', vi: 'Đang chờ',
      hi: 'लंबित', es: 'Pendiente', fr: 'En attente',
      de: 'Ausstehend', id: 'Menunggu', ms: 'Menunggu'
    },
    printPreview: {
      th: 'ตัวอย่างก่อนพิมพ์', en: 'Print Preview', zh: '打印预览',
      ja: '印刷プレビュー', ko: '인쇄 미리보기', vi: 'Xem trước bản in',
      hi: 'प्रिंट पूर्वावलोकन', es: 'Vista previa de impresión', fr: 'Aperçu avant impression',
      de: 'Druckvorschau', id: 'Pratinjau Cetak', ms: 'Pratonton Cetak'
    },
    dailyCashierReport: {
      th: 'รายงานแคชเชียร์ประจำวัน', en: 'Daily Cashier Report', zh: '每日收银报告',
      ja: '日次レジ報告', ko: '일일 캐셔 보고서', vi: 'Báo cáo thu ngân hàng ngày',
      hi: 'दैनिक कैशियर रिपोर्ट', es: 'Informe de caja diario', fr: 'Rapport de caisse quotidien',
      de: 'Täglicher Kassenbericht', id: 'Laporan Kasir Harian', ms: 'Laporan Juruwang Harian'
    },
    ordersSummary: {
      th: 'สรุปออเดอร์', en: 'Orders Summary', zh: '订单摘要',
      ja: '注文概要', ko: '주문 요약', vi: 'Tóm tắt đơn hàng',
      hi: 'ऑर्डर सारांश', es: 'Resumen de pedidos', fr: 'Résumé des commandes',
      de: 'Bestellübersicht', id: 'Ringkasan Pesanan', ms: 'Ringkasan Pesanan'
    },
    voidReasons: {
      th: 'เหตุผลการยกเลิก', en: 'Void Reasons', zh: '取消原因',
      ja: 'キャンセル理由', ko: '취소 사유', vi: 'Lý do hủy',
      hi: 'रद्द करने के कारण', es: 'Razones de anulación', fr: 'Raisons d\'annulation',
      de: 'Stornierungsgründe', id: 'Alasan Pembatalan', ms: 'Sebab Pembatalan'
    },
    voidReason: {
      th: 'เหตุผลยกเลิก', en: 'Void Reason', zh: '取消原因',
      ja: 'キャンセル理由', ko: '취소 사유', vi: 'Lý do hủy',
      hi: 'रद्द करने का कारण', es: 'Razón de anulación', fr: 'Raison d\'annulation',
      de: 'Stornierungsgrund', id: 'Alasan Pembatalan', ms: 'Sebab Pembatalan'
    },
    payment: {
      th: 'การชำระเงิน', en: 'Payment', zh: '付款',
      ja: '支払い', ko: '결제', vi: 'Thanh toán',
      hi: 'भुगतान', es: 'Pago', fr: 'Paiement',
      de: 'Zahlung', id: 'Pembayaran', ms: 'Pembayaran'
    },
    revenueByPaymentMethod: {
      th: 'รายได้ตามวิธีชำระ', en: 'Revenue by Payment', zh: '按付款方式收入',
      ja: '支払い方法別収益', ko: '결제별 수익', vi: 'Doanh thu theo thanh toán',
      hi: 'भुगतान द्वारा राजस्व', es: 'Ingresos por pago', fr: 'Revenus par paiement',
      de: 'Umsatz nach Zahlung', id: 'Pendapatan per Pembayaran', ms: 'Hasil mengikut Pembayaran'
    },
    printed: {
      th: 'พิมพ์เมื่อ', en: 'Printed', zh: '打印时间',
      ja: '印刷日時', ko: '인쇄 시간', vi: 'In lúc',
      hi: 'प्रिंट', es: 'Impreso', fr: 'Imprimé',
      de: 'Gedruckt', id: 'Dicetak', ms: 'Dicetak'
    },
    poweredBy: {
      th: 'ขับเคลื่อนโดย', en: 'Powered by', zh: '技术支持',
      ja: '提供', ko: '제공', vi: 'Cung cấp bởi',
      hi: 'द्वारा संचालित', es: 'Desarrollado por', fr: 'Propulsé par',
      de: 'Unterstützt von', id: 'Didukung oleh', ms: 'Dikuasakan oleh'
    },
  },

  // Common
  common: {
    loading: {
      th: 'กำลังโหลด...', en: 'Loading...', zh: '加载中...',
      ja: '読み込み中...', ko: '로딩 中...', vi: 'Đang tải...',
      hi: 'लोड हो रहा है...', es: 'Cargando...', fr: 'Chargement...',
      de: 'Laden...', id: 'Memuat...', ms: 'Memuatkan...'
    },
    error: {
      th: 'เกิดข้อผิดพลาด', en: 'Error', zh: '错误',
      ja: 'エラー', ko: '오류', vi: 'Lỗi',
      hi: 'त्रुटि', es: 'Error', fr: 'Erreur',
      de: 'Fehler', id: 'Kesalahan', ms: 'Ralat'
    },
    success: {
      th: 'สำเร็จ', en: 'Success', zh: '成功',
      ja: '成功', ko: '성공', vi: 'Thành công',
      hi: 'सफल', es: 'Éxito', fr: 'Succès',
      de: 'Erfolg', id: 'Berhasil', ms: 'Berjaya'
    },
    cancel: {
      th: 'ยกเลิก', en: 'Cancel', zh: '取消',
      ja: 'キャンセル', ko: '취소', vi: 'Hủy',
      hi: 'रद्द करें', es: 'Cancelar', fr: 'Annuler',
      de: 'Abbrechen', id: 'Batal', ms: 'Batal'
    },
    confirm: {
      th: 'ยืนยัน', en: 'Confirm', zh: '确认',
      ja: '確認', ko: '확인', vi: 'Xác nhận',
      hi: 'पुष्टि करें', es: 'Confirmar', fr: 'Confirmer',
      de: 'Bestätigen', id: 'Konfirmasi', ms: 'Sahkan'
    },
    save: {
      th: 'บันทึก', en: 'Save', zh: '保存',
      ja: '保存', ko: '저장', vi: 'Lưu',
      hi: 'सहेजें', es: 'Guardar', fr: 'Enregistrer',
      de: 'Speichern', id: 'Simpan', ms: 'Simpan'
    },
    close: {
      th: 'ปิด', en: 'Close', zh: '关闭',
      ja: '閉じる', ko: '닫기', vi: 'Đóng',
      hi: 'बंद करें', es: 'Cerrar', fr: 'Fermer',
      de: 'Schließen', id: 'Tutup', ms: 'Tutup'
    },
  },
};

type TranslationValue = Record<POSLanguage, string>;

// Helper function to get translated text
export function t(
  category: keyof typeof posTranslations,
  key: string,
  lang: POSLanguage = 'en'
): string {
  const categoryObj = posTranslations[category] as Record<string, TranslationValue>;
  if (categoryObj && categoryObj[key]) {
    return categoryObj[key][lang] || categoryObj[key]['en'] || key;
  }
  return key;
}

// Helper function to get bilingual text (primary language + English subtitle)
export function tBilingual(
  category: keyof typeof posTranslations,
  key: string,
  lang: POSLanguage = 'en'
): { primary: string; english: string } {
  const categoryObj = posTranslations[category] as Record<string, TranslationValue>;
  if (categoryObj && categoryObj[key]) {
    const primary = categoryObj[key][lang] || categoryObj[key]['en'] || key;
    const english = categoryObj[key]['en'] || key;
    return { primary, english };
  }
  return { primary: key, english: key };
}

// Map primary_language from settings to POSLanguage
export function mapToPOSLanguage(primaryLanguage: string): POSLanguage {
  const langMap: Record<string, POSLanguage> = {
    'th': 'th', 'thai': 'th',
    'en': 'en', 'english': 'en', 'en-US': 'en', 'en-GB': 'en',
    'zh': 'zh', 'zh-CN': 'zh', 'zh-TW': 'zh', 'chinese': 'zh',
    'ja': 'ja', 'japanese': 'ja',
    'ko': 'ko', 'korean': 'ko',
    'vi': 'vi', 'vietnamese': 'vi',
    'hi': 'hi', 'hindi': 'hi',
    'es': 'es', 'spanish': 'es',
    'fr': 'fr', 'french': 'fr',
    'de': 'de', 'german': 'de',
    'id': 'id', 'indonesian': 'id',
    'ms': 'ms', 'malay': 'ms',
  };

  return langMap[primaryLanguage.toLowerCase()] || 'en';
}
