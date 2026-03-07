"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Language = "en" | "vi" | "zh";

type RankingGroup = {
  groupKey: string;
  groupName: string;
  rankingType: "Top 10" | "Top 5";
  companies: string[];
};

type ProductCard = {
  name: string;
  sku: string;
  category: string;
  packSpec: string;
  aiStatus: "Matched" | "Review" | "Missing";
  image: string;
  sourceUrl?: string;
};

const content = {
  en: {
    brandSub: "Retail Intelligence Platform",
    overview: "Admin Dashboard",
    overviewDesc:
      "Manage ranked food & beverage companies by sector and prepare AI product discovery workflows.",
    navDashboard: "Dashboard",
    navStores: "Companies",
    navZones: "Sectors",
    navInventory: "Products",
    navReports: "Reports",
    navSettings: "Settings",
    welcome: "Welcome back, Admin",
    search: "Search group, company, product...",
    export: "Export Report",
    quickTitle: "Quick Actions",
    quickDesc: "Access your most-used management tools.",
    logout: "Log out",
    langLabel: "Language",
    rankGroups: "Industry Ranking Groups",
    rankGroupsDesc:
      "Choose a sector first, then select a company within that ranking group.",
    rankingType: "Ranking Type",
    sectorName: "Sector",
    companyName: "Company",
    companyCount: "Number of companies",
    selectedCompany: "Selected company",
    aiTitle: "AI Suggested Product Display",
    aiDesc:
      "This version uses product references from Bach Hoa Xanh for selected demo items and keeps the dashboard stable for testing.",
    productTitle: "AI Suggested Product Display",
    productDesc:
      "Products below are mapped by sector and company. Some cards include Bach Hoa Xanh source links.",
    status: "Status",
    matched: "Matched",
    review: "Review",
    missing: "Missing",
    packSpec: "Case Spec",
    sku: "SKU",
    category: "Category",
    topCompanies: "Ranked Companies",
    topCompaniesDesc: "The full list shown for the selected ranking group.",
    rank: "Rank",
    action: "Action",
    open: "Open",
    source: "View Bach Hoa Xanh source",
  },
  vi: {
    brandSub: "Nền tảng trí tuệ bán lẻ",
    overview: "Dashboard Quản Trị",
    overviewDesc:
      "Quản lý các công ty thực phẩm - đồ uống theo từng nhóm ngành và chuẩn bị quy trình AI tìm sản phẩm.",
    navDashboard: "Dashboard",
    navStores: "Công ty",
    navZones: "Nhóm ngành",
    navInventory: "Sản phẩm",
    navReports: "Báo cáo",
    navSettings: "Cài đặt",
    welcome: "Chào mừng trở lại, Admin",
    search: "Tìm nhóm ngành, công ty, sản phẩm...",
    export: "Xuất báo cáo",
    quickTitle: "Thao tác nhanh",
    quickDesc: "Truy cập nhanh các công cụ quản trị thường dùng.",
    logout: "Đăng xuất",
    langLabel: "Ngôn ngữ",
    rankGroups: "Nhóm ngành xếp hạng",
    rankGroupsDesc:
      "Chọn nhóm ngành trước, sau đó chọn công ty nằm trong bảng xếp hạng của nhóm đó.",
    rankingType: "Loại xếp hạng",
    sectorName: "Nhóm ngành",
    companyName: "Tên công ty",
    companyCount: "Số lượng công ty",
    selectedCompany: "Công ty đang chọn",
    aiTitle: "Sản phẩm AI gợi ý hiển thị",
    aiDesc:
      "Phiên bản này dùng tham chiếu sản phẩm từ Bách Hóa Xanh cho một số mặt hàng demo và giữ dashboard ổn định để kiểm tra.",
    productTitle: "Sản phẩm AI gợi ý hiển thị",
    productDesc:
      "Các sản phẩm bên dưới được gán theo nhóm ngành và công ty. Một số thẻ có link nguồn từ Bách Hóa Xanh.",
    status: "Trạng thái",
    matched: "Khớp",
    review: "Cần kiểm tra",
    missing: "Thiếu dữ liệu",
    packSpec: "Quy cách thùng",
    sku: "Mã SKU",
    category: "Danh mục",
    topCompanies: "Danh sách công ty xếp hạng",
    topCompaniesDesc: "Hiển thị đầy đủ danh sách của nhóm ngành đang chọn.",
    rank: "Hạng",
    action: "Thao tác",
    open: "Mở",
    source: "Xem nguồn Bách Hóa Xanh",
  },
  zh: {
    brandSub: "零售智能平台",
    overview: "管理仪表板",
    overviewDesc:
      "按细分行业管理食品饮料企业，并准备 AI 商品发现流程。",
    navDashboard: "仪表板",
    navStores: "公司",
    navZones: "行业组",
    navInventory: "商品",
    navReports: "报告",
    navSettings: "设置",
    welcome: "欢迎回来，管理员",
    search: "搜索行业组、公司、商品...",
    export: "导出报告",
    quickTitle: "快捷操作",
    quickDesc: "快速访问常用管理工具。",
    logout: "退出登录",
    langLabel: "语言",
    rankGroups: "行业排名分组",
    rankGroupsDesc: "先选择行业组，再选择该组中的公司。",
    rankingType: "排名类型",
    sectorName: "行业组",
    companyName: "公司名称",
    companyCount: "公司数量",
    selectedCompany: "当前公司",
    aiTitle: "AI 建议商品展示",
    aiDesc:
      "此版本为演示版，部分商品引用自 Bach Hoa Xanh 页面，并保证界面稳定。",
    productTitle: "AI 建议商品展示",
    productDesc:
      "下方商品根据行业组和公司映射，部分卡片带有 Bach Hoa Xanh 来源链接。",
    status: "状态",
    matched: "已匹配",
    review: "需检查",
    missing: "缺少数据",
    packSpec: "箱规",
    sku: "SKU",
    category: "分类",
    topCompanies: "排名公司列表",
    topCompaniesDesc: "显示当前所选行业组的完整公司名单。",
    rank: "排名",
    action: "操作",
    open: "打开",
    source: "查看 Bach Hoa Xanh 来源",
  },
};

const fnbRankings2024: RankingGroup[] = [
  {
    groupKey: "dairy",
    groupName: "Sữa và sản phẩm từ sữa",
    rankingType: "Top 10",
    companies: [
      "Công ty CP Sữa Việt Nam",
      "Công ty CP Sữa TH",
      "Công ty TNHH FrieslandCampina Việt Nam",
      "Công ty Cổ phần Sữa Quốc tế LOF",
      "Công ty CP Thực phẩm Dinh dưỡng Nutifood",
      "Công ty Cổ phần Sữa Vitadairy Việt Nam",
      "Công ty Cổ phần Giống Bò sữa Mộc Châu",
      "Công ty Cổ phần Thực phẩm Đông lạnh Kido",
      "Công ty Cổ phần Dinh dưỡng Nutricare",
      "Công ty TNHH Mead Johnson Nutrition (Việt Nam)",
    ],
  },
  {
    groupKey: "nutrition_confectionery",
    groupName: "Đường, bánh kẹo và sản phẩm dinh dưỡng",
    rankingType: "Top 10",
    companies: [
      "Công ty TNHH Nestlé Viet Nam",
      "Công ty TNHH Thực phẩm Orion Vina",
      "Công ty Cổ phần Mondelez Kinh Đô Việt Nam",
      "Công ty Cổ phần Thành Thành Công - Biên Hòa",
      "Công ty Cổ phần Đường Quảng Ngãi",
      "Công ty TNHH MTV Herbalife Việt Nam",
      "Công ty TNHH Perfetti Van Melle (Việt Nam)",
      "Công ty Cổ phần Liwayway Việt Nam",
      "Công ty Cổ phần Bibica",
      "Công ty Cổ phần Richy Group",
    ],
  },
  {
    groupKey: "condiments_oil",
    groupName: "Nước chấm, gia vị, dầu ăn",
    rankingType: "Top 10",
    companies: [
      "Công ty Cổ phần Hàng tiêu dùng Masan",
      "Công ty Cổ phần Thực phẩm Cholimex",
      "Công ty TNHH Calofic",
      "Công ty Cổ phần Dầu Thực vật Tường An",
      "Công ty Cổ phần hữu hạn Vedan Việt Nam",
      "Công ty TNHH Thực phẩm Quốc tế Nam Dương",
      "Công ty Cổ phần Thực phẩm An Long",
      "Công ty TNHH Kewpie Việt Nam",
      "Công ty TNHH Daesang Việt Nam",
      "Công ty TNHH Nam Phương V.N",
    ],
  },
  {
    groupKey: "dry_instant",
    groupName: "Thực phẩm khô, đồ ăn liền",
    rankingType: "Top 10",
    companies: [
      "Công ty Cổ phần Acecook Việt Nam",
      "Công ty Cổ phần Hàng tiêu dùng Masan",
      "Công ty Cổ phần Thực phẩm Á Châu",
      "Công ty TNHH Uni - President Việt Nam",
      "Công ty Cổ phần Uniben",
      "Công ty Cổ phần Kỹ nghệ Thực phẩm Việt Nam",
      "Công ty Cổ phần Lương thực Thực phẩm Safoco",
      "Công ty Cổ phần Thực phẩm Bích Chi",
      "Công ty Cổ phần Lương thực Thực phẩm Colusa - Miliket",
      "Công ty Cổ phần Đồ hộp Hạ Long",
    ],
  },
  {
    groupKey: "fresh_frozen",
    groupName: "Thực phẩm tươi, đông lạnh",
    rankingType: "Top 10",
    companies: [
      "Công ty Cổ phần Chăn nuôi C.P Việt Nam",
      "Công ty Cổ phần Greenfeed Việt Nam",
      "Công ty Cổ phần Việt Nam Kỹ nghệ Súc sản (Vissan)",
      "Công ty Cổ phần Vĩnh Hoàn",
      "Công ty Cổ phần Thực phẩm Sao Ta",
      "Công ty Cổ phần Tập đoàn Thủy sản Minh Phú",
      "Công ty Cổ phần Tập đoàn Dabaco Việt Nam",
      "Công ty Cổ phần Nam Việt",
      "Công ty Cổ phần Ba Huân",
      "Công ty Cổ phần Daesang Đức Việt",
    ],
  },
  {
    groupKey: "alcoholic",
    groupName: "Đồ uống có cồn",
    rankingType: "Top 10",
    companies: [
      "Công ty TNHH Nhà máy Bia Heineken Việt Nam",
      "Tổng Công ty CP Bia Rượu Nước giải khát Sài Gòn",
      "Tổng Công ty CP Bia - Rượu - Nước giải khát Hà Nội",
      "Công ty Cổ phần Bia và Nước giải khát Hạ Long",
      "Công ty TNHH Bia Carlsberg Việt Nam",
      "Công ty TNHH Sapporo Việt Nam",
      "Công ty TNHH Bia Anheuser-Busch Inbev Việt Nam",
      "Công ty Cổ phần Tập đoàn Hương Sen",
      "Công ty Cổ phần Thực phẩm Lâm Đồng",
      "Công ty Cổ phần Tập đoàn Bia Sài Gòn Bình Tây",
    ],
  },
  {
    groupKey: "non_alcoholic",
    groupName: "Đồ uống không cồn",
    rankingType: "Top 10",
    companies: [
      "Công ty TNHH Nước giải khát Suntory Pepsico Việt Nam",
      "Công ty TNHH Nước giải khát Coca-Cola Việt Nam",
      "Tập đoàn Trung Nguyên Legend",
      "Công ty TNHH URC Vietnam",
      "Công ty Cổ phần Vinacafé Biên Hòa",
      "Công ty TNHH Lavie",
      "Công ty Cổ phần Thực phẩm Quốc tế",
      "Công ty Cổ phần Nước giải khát Sanest Khánh Hòa",
      "Công ty Cổ phần Xuất nhập khẩu Bến Tre",
      "Công ty Cổ phần Sản phẩm Sinh thái Eco",
    ],
  },
  {
    groupKey: "restaurant_chain",
    groupName: "Chuỗi nhà hàng, dịch vụ đồ ăn, nhượng quyền",
    rankingType: "Top 5",
    companies: [
      "Công ty Cổ phần Tập đoàn Golden Gate",
      "Công ty TNHH Jollibee Việt Nam",
      "Công ty Cổ phần Pizza 4Ps",
      "Công ty Liên doanh TNHH KFC Việt Nam",
      "Công ty Cổ phần Pizza Ngon",
    ],
  },
  {
    groupKey: "cafe_chain",
    groupName: "Chuỗi cửa hàng café, dịch vụ đồ uống, nhượng quyền",
    rankingType: "Top 5",
    companies: [
      "Tập đoàn Trung Nguyên Legend",
      "Công ty Cổ phần Dịch vụ Cà phê Cao Nguyên (Highlands Coffee)",
      "Công ty Cổ phần Phúc Long Heritage",
      "Công ty TNHH Thực phẩm & Nước giải khát Ý Tưởng Việt (Starbucks)",
      "Công ty Cổ phần Phê La",
    ],
  },
];

function buildDemoProducts(group: RankingGroup, company: string): ProductCard[] {
  const presets: Record<string, ProductCard[]> = {
    dairy: [
      {
        name: "Thùng 48 hộp sữa tươi TH true MILK 180ml",
        sku: "BHX-DAIRY-001",
        category: "Sữa nước",
        packSpec: "Thùng 48 hộp x 180ml",
        aiStatus: "Matched",
        image:
          "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1200&q=80",
        sourceUrl:
          "https://www.bachhoaxanh.com/sua-tuoi/sua-tiet-trung-th-co-duong-180ml-thung-48-hop",
      },
      {
        name: `${company} - Sữa chua uống`,
        sku: "DAIRY-002",
        category: "Sữa chua",
        packSpec: "Lốc 4 chai / thùng 12 lốc",
        aiStatus: "Review",
        image:
          "https://images.unsplash.com/photo-1576186726115-4d51596775d1?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: `${company} - Sữa bột dinh dưỡng`,
        sku: "DAIRY-003",
        category: "Dinh dưỡng",
        packSpec: "Thùng 12 lon",
        aiStatus: "Matched",
        image:
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    nutrition_confectionery: [
      {
        name: `${company} - Bánh quy dinh dưỡng`,
        sku: "NC-001",
        category: "Bánh kẹo",
        packSpec: "Thùng 24 hộp",
        aiStatus: "Matched",
        image:
          "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: `${company} - Thanh năng lượng`,
        sku: "NC-002",
        category: "Dinh dưỡng",
        packSpec: "Thùng 48 thanh",
        aiStatus: "Review",
        image:
          "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: `${company} - Kẹo viên`,
        sku: "NC-003",
        category: "Kẹo",
        packSpec: "Thùng 30 gói",
        aiStatus: "Matched",
        image:
          "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    condiments_oil: [
      {
        name: "Tương ớt Chin-su chai 250g",
        sku: "BHX-COND-001",
        category: "Nước chấm",
        packSpec: "Chai 250g",
        aiStatus: "Matched",
        image:
          "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80",
        sourceUrl:
          "https://www.bachhoaxanh.com/tuong-ot-ca-den/tuong-ot-chinsu-chai-250g",
      },
      {
        name: `${company} - Dầu ăn tinh luyện`,
        sku: "COND-002",
        category: "Dầu ăn",
        packSpec: "12 chai/thùng",
        aiStatus: "Review",
        image:
          "https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: `${company} - Nước mắm / nước chấm`,
        sku: "COND-003",
        category: "Gia vị",
        packSpec: "24 chai/thùng",
        aiStatus: "Matched",
        image:
          "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    dry_instant: [
      {
        name: "Thùng 30 gói mì Hảo Hảo tôm chua cay 75g",
        sku: "BHX-DRY-001",
        category: "Đồ ăn liền",
        packSpec: "Thùng 30 gói x 75g",
        aiStatus: "Matched",
        image:
          "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=1200&q=80",
        sourceUrl:
          "https://www.bachhoaxanh.com/mi/mi-hao-hao-tom-chua-cay-75g-30",
      },
      {
        name: `${company} - Cháo ăn liền`,
        sku: "DRY-002",
        category: "Thực phẩm khô",
        packSpec: "Thùng 24 ly",
        aiStatus: "Review",
        image:
          "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: `${company} - Nui / mì khô`,
        sku: "DRY-003",
        category: "Thực phẩm khô",
        packSpec: "20 gói/thùng",
        aiStatus: "Missing",
        image:
          "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    fresh_frozen: [
      {
        name: `${company} - Thịt chế biến`,
        sku: "FF-001",
        category: "Thực phẩm tươi",
        packSpec: "10 khay/thùng",
        aiStatus: "Matched",
        image:
          "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: `${company} - Hải sản đông lạnh`,
        sku: "FF-002",
        category: "Đông lạnh",
        packSpec: "Thùng 5kg",
        aiStatus: "Review",
        image:
          "https://images.unsplash.com/photo-1510130387422-82bed34b37e9?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: `${company} - Trứng / gia cầm`,
        sku: "FF-003",
        category: "Tươi sống",
        packSpec: "Khay 30 quả / thùng 12 khay",
        aiStatus: "Matched",
        image:
          "https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    alcoholic: [
      {
        name: `${company} - Bia lon premium`,
        sku: "ALC-001",
        category: "Bia",
        packSpec: "Thùng 24 lon x 330ml",
        aiStatus: "Matched",
        image:
          "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: `${company} - Bia chai`,
        sku: "ALC-002",
        category: "Bia",
        packSpec: "Két 20 chai",
        aiStatus: "Review",
        image:
          "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: `${company} - Đồ uống malt`,
        sku: "ALC-003",
        category: "Malt Beverage",
        packSpec: "Thùng 24 lon",
        aiStatus: "Missing",
        image:
          "https://images.unsplash.com/photo-1436076863939-06870fe779c2?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    non_alcoholic: [
      {
        name: "Thùng 24 lon nước ngọt Pepsi Cola 320ml",
        sku: "BHX-NA-001",
        category: "Nước giải khát",
        packSpec: "Thùng 24 lon x 320ml",
        aiStatus: "Matched",
        image:
          "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=1200&q=80",
        sourceUrl:
          "https://www.bachhoaxanh.com/nuoc-ngot/nuoc-ngot-lon-pepsi-cola-sleek-330ml-th24",
      },
      {
        name: `${company} - Nước tăng lực`,
        sku: "NA-002",
        category: "Đồ uống chức năng",
        packSpec: "Thùng 24 chai",
        aiStatus: "Review",
        image:
          "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: `${company} - Cà phê đóng chai`,
        sku: "NA-003",
        category: "Đồ uống RTD",
        packSpec: "Thùng 24 chai",
        aiStatus: "Matched",
        image:
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    restaurant_chain: [
      {
        name: `${company} - Set combo nhà hàng`,
        sku: "RST-001",
        category: "Combo menu",
        packSpec: "Không áp dụng quy cách thùng",
        aiStatus: "Review",
        image:
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: `${company} - Món chủ lực`,
        sku: "RST-002",
        category: "Menu signature",
        packSpec: "Không áp dụng quy cách thùng",
        aiStatus: "Matched",
        image:
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: `${company} - Dịch vụ buffet / set meal`,
        sku: "RST-003",
        category: "Food Service",
        packSpec: "Quản lý theo suất / combo",
        aiStatus: "Review",
        image:
          "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    cafe_chain: [
      {
        name: `${company} - Cà phê signature`,
        sku: "CAF-001",
        category: "Coffee",
        packSpec: "Không áp dụng quy cách thùng",
        aiStatus: "Matched",
        image:
          "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: `${company} - Trà sữa / tea line`,
        sku: "CAF-002",
        category: "Beverage Service",
        packSpec: "Quản lý theo menu / size",
        aiStatus: "Review",
        image:
          "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: `${company} - Hạt / gói cà phê bán lẻ`,
        sku: "CAF-003",
        category: "Retail Coffee",
        packSpec: "Thùng 24 gói",
        aiStatus: "Matched",
        image:
          "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  };

  return presets[group.groupKey] ?? presets.non_alcoholic;
}

function statusClass(status: ProductCard["aiStatus"]) {
  if (status === "Matched") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Review") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-red-200 bg-red-50 text-red-700";
}

export default function DashboardPage() {
  const [language, setLanguage] = useState<Language>("vi");
  const [selectedGroupKey, setSelectedGroupKey] = useState(fnbRankings2024[0].groupKey);
  const [selectedCompany, setSelectedCompany] = useState(fnbRankings2024[0].companies[0]);

  const t = useMemo(() => content[language], [language]);

  const currentGroup = useMemo(() => {
    return fnbRankings2024.find((item) => item.groupKey === selectedGroupKey) ?? fnbRankings2024[0];
  }, [selectedGroupKey]);

  useEffect(() => {
    setSelectedCompany(currentGroup.companies[0]);
  }, [currentGroup]);

  const productCards = useMemo(() => {
    return buildDemoProducts(currentGroup, selectedCompany);
  }, [currentGroup, selectedCompany]);

  const localizedStatus = (status: ProductCard["aiStatus"]) => {
    if (status === "Matched") return t.matched;
    if (status === "Review") return t.review;
    return t.missing;
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-slate-950 text-white lg:flex">
          <div className="border-b border-white/10 p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-slate-900 shadow-xl shadow-cyan-500/30 ring-1 ring-white/20">
                <div className="absolute inset-1 rounded-[20px] border border-white/20" />
                <div className="relative text-xl font-black text-white">S</div>
                <div className="absolute -right-1 -top-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold tracking-widest text-slate-900">
                  AI
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">
                  Shelf<span className="text-cyan-300">Sight</span> AI
                </h1>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                  {t.brandSub}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6">
            <div className="space-y-2">
              <div className="rounded-2xl bg-white/10 px-4 py-3 font-semibold text-cyan-200">
                {t.navDashboard}
              </div>
              <div className="rounded-2xl px-4 py-3 text-slate-300 transition hover:bg-white/5">
                {t.navStores}
              </div>
              <div className="rounded-2xl px-4 py-3 text-slate-300 transition hover:bg-white/5">
                {t.navZones}
              </div>
              <div className="rounded-2xl px-4 py-3 text-slate-300 transition hover:bg-white/5">
                {t.navInventory}
              </div>
              <div className="rounded-2xl px-4 py-3 text-slate-300 transition hover:bg-white/5">
                {t.navReports}
              </div>
              <div className="rounded-2xl px-4 py-3 text-slate-300 transition hover:bg-white/5">
                {t.navSettings}
              </div>
            </div>
          </nav>

          <div className="border-t border-white/10 p-4">
            <Link
              href="/"
              className="block rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              {t.logout}
            </Link>
          </div>
        </aside>

        <main className="flex-1">
          <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
                  {t.overview}
                </p>
                <h2 className="mt-1 text-3xl font-bold text-slate-900">{t.welcome}</h2>
                <p className="mt-2 max-w-3xl text-sm text-slate-500">{t.overviewDesc}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  placeholder={t.search}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 sm:w-80"
                />

                <div className="grid grid-cols-3 rounded-2xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      language === "en" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("vi")}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      language === "vi" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    VI
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("zh")}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      language === "zh" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    中文
                  </button>
                </div>

                <button
                  type="button"
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {t.export}
                </button>
              </div>
            </div>
          </header>

          <div className="p-6 lg:p-8">
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-xl font-bold text-slate-900">{t.rankGroups}</h3>
                <p className="mt-1 text-sm text-slate-500">{t.rankGroupsDesc}</p>

                <div className="mt-6 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      {t.sectorName}
                    </label>
                    <select
                      value={selectedGroupKey}
                      onChange={(e) => setSelectedGroupKey(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    >
                      {fnbRankings2024.map((group) => (
                        <option key={group.groupKey} value={group.groupKey}>
                          {group.rankingType} - {group.groupName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      {t.rankingType}
                    </label>
                    <input
                      type="text"
                      value={currentGroup.rankingType}
                      readOnly
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      {t.companyName}
                    </label>
                    <select
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    >
                      {currentGroup.companies.map((company) => (
                        <option key={company} value={company}>
                          {company}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      {t.companyCount}
                    </label>
                    <input
                      type="text"
                      value={`${currentGroup.companies.length}`}
                      readOnly
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none"
                    />
                  </div>

                  <div className="rounded-3xl border border-cyan-100 bg-cyan-50 p-5">
                    <p className="text-sm font-semibold text-cyan-700">{t.aiTitle}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{t.aiDesc}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{t.productTitle}</h3>
                    <p className="mt-1 text-sm text-slate-500">{t.productDesc}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                    {t.selectedCompany}
                  </div>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {productCards.map((product) => (
                    <div
                      key={product.sku}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="p-5">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h4 className="line-clamp-2 text-base font-bold text-slate-900">
                            {product.name}
                          </h4>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                              product.aiStatus
                            )}`}
                          >
                            {localizedStatus(product.aiStatus)}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm text-slate-600">
                          <p>
                            <span className="font-semibold text-slate-800">{t.sku}:</span>{" "}
                            {product.sku}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">{t.category}:</span>{" "}
                            {product.category}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">{t.packSpec}:</span>{" "}
                            {product.packSpec}
                          </p>
                        </div>

                        {product.sourceUrl && (
                          <a
                            href={product.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 block rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-center text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                          >
                            {t.source}
                          </a>
                        )}

                        <button className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                          {t.open}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{t.topCompanies}</h3>
                  <p className="mt-1 text-sm text-slate-500">{t.topCompaniesDesc}</p>
                </div>
                <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                  {currentGroup.rankingType}
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-sm text-slate-500">
                      <th className="px-3 py-3 font-semibold">{t.rank}</th>
                      <th className="px-3 py-3 font-semibold">{t.companyName}</th>
                      <th className="px-3 py-3 font-semibold">{t.sectorName}</th>
                      <th className="px-3 py-3 font-semibold">{t.rankingType}</th>
                      <th className="px-3 py-3 font-semibold">{t.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentGroup.companies.map((company, index) => (
                      <tr key={company} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-4 font-semibold text-slate-900">#{index + 1}</td>
                        <td className="px-3 py-4 font-semibold text-slate-900">{company}</td>
                        <td className="px-3 py-4 text-slate-600">{currentGroup.groupName}</td>
                        <td className="px-3 py-4 text-slate-600">{currentGroup.rankingType}</td>
                        <td className="px-3 py-4">
                          <button
                            onClick={() => setSelectedCompany(company)}
                            className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                          >
                            {t.open}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}