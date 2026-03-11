"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Language = "en" | "vi" | "zh";

type RankingGroup = {
  groupKey: string;
  groupName: string;
  companies: string[];
};

type ProductCard = {
  name: string;
  sku: string;
  category: string;
  packSpec: string;
  aiStatus: "Matched" | "Review" | "Missing";
  images: string[];
  sourceUrl?: string;
};

const content = {
  en: {
    brandSub: "Retail Intelligence Platform",
    overview: "Admin Dashboard",
    overviewDesc:
      "Manage food and beverage companies by sector and verify local product image mapping.",
    navDashboard: "Dashboard",
    navStores: "Companies",
    navZones: "Sectors",
    navInventory: "Products",
    navReports: "Reports",
    navSettings: "Settings",
    welcome: "Welcome back, Admin",
    search: "Search sector, company, product...",
    export: "Export Report",
    logout: "Log out",
    groupsTitle: "Industry Groups",
    groupsDesc: "Choose a sector, then choose a company in that sector.",
    sectorName: "Sector",
    companyName: "Company",
    companyCount: "Number of companies",
    selectedCompany: "Selected company",
    aiTitle: "AI Suggested Product Display",
    aiDesc:
      "This version reads local product images from your saved folder structure. Ajinomoto is configured first for validation.",
    productTitle: "AI Suggested Product Display",
    productDesc:
      "Products below are loaded from your local folder structure for the selected company.",
    matched: "Matched",
    review: "Review",
    missing: "Missing",
    packSpec: "Pack Spec",
    sku: "SKU",
    category: "Category",
    companyList: "Company List",
    companyListDesc: "The full list shown for the selected sector.",
    rank: "No.",
    action: "Action",
    open: "Open",
    noProducts: "No product data for this company yet.",
    imageCount: "images",
  },
  vi: {
    brandSub: "Nền tảng trí tuệ bán lẻ",
    overview: "Dashboard Quản Trị",
    overviewDesc:
      "Quản lý các công ty thực phẩm - đồ uống theo nhóm ngành và kiểm tra ánh xạ hình ảnh sản phẩm local.",
    navDashboard: "Dashboard",
    navStores: "Công ty",
    navZones: "Nhóm ngành",
    navInventory: "Sản phẩm",
    navReports: "Báo cáo",
    navSettings: "Cài đặt",
    welcome: "Chào mừng trở lại, Admin",
    search: "Tìm nhóm ngành, công ty, sản phẩm...",
    export: "Xuất báo cáo",
    logout: "Đăng xuất",
    groupsTitle: "Nhóm ngành",
    groupsDesc: "Chọn nhóm ngành trước, sau đó chọn công ty thuộc nhóm đó.",
    sectorName: "Nhóm ngành",
    companyName: "Tên công ty",
    companyCount: "Số lượng công ty",
    selectedCompany: "Công ty đang chọn",
    aiTitle: "Sản phẩm AI gợi ý hiển thị",
    aiDesc:
      "Phiên bản này đọc ảnh local từ đúng cấu trúc thư mục bạn đã lưu. Hiện tại Ajinomoto được cấu hình trước để kiểm tra độ chính xác.",
    productTitle: "Sản phẩm AI gợi ý hiển thị",
    productDesc:
      "Các sản phẩm bên dưới được lấy từ cấu trúc thư mục local của công ty đang chọn.",
    matched: "Khớp",
    review: "Cần kiểm tra",
    missing: "Thiếu dữ liệu",
    packSpec: "Quy cách",
    sku: "Mã SKU",
    category: "Danh mục",
    companyList: "Danh sách công ty",
    companyListDesc: "Hiển thị đầy đủ danh sách công ty của nhóm ngành đang chọn.",
    rank: "STT",
    action: "Thao tác",
    open: "Mở",
    noProducts: "Chưa có dữ liệu sản phẩm cho công ty này.",
    imageCount: "ảnh",
  },
  zh: {
    brandSub: "零售智能平台",
    overview: "管理仪表板",
    overviewDesc:
      "按行业管理食品饮料公司，并检查本地商品图片映射。",
    navDashboard: "仪表板",
    navStores: "公司",
    navZones: "行业组",
    navInventory: "商品",
    navReports: "报告",
    navSettings: "设置",
    welcome: "欢迎回来，管理员",
    search: "搜索行业、公司、商品...",
    export: "导出报告",
    logout: "退出登录",
    groupsTitle: "行业组",
    groupsDesc: "先选择行业组，再选择该行业中的公司。",
    sectorName: "行业组",
    companyName: "公司名称",
    companyCount: "公司数量",
    selectedCompany: "当前公司",
    aiTitle: "AI 建议商品展示",
    aiDesc:
      "此版本从你保存的本地文件夹结构读取图片，目前先准确配置 Ajinomoto 用于验证。",
    productTitle: "AI 建议商品展示",
    productDesc: "下方商品根据当前公司从本地文件夹结构中读取。",
    matched: "已匹配",
    review: "需检查",
    missing: "缺少数据",
    packSpec: "规格",
    sku: "SKU",
    category: "分类",
    companyList: "公司列表",
    companyListDesc: "显示当前行业组的完整公司列表。",
    rank: "序号",
    action: "操作",
    open: "打开",
    noProducts: "该公司暂无商品数据。",
    imageCount: "张",
  },
};

function productImagePath(
  groupFolder: string,
  companyFolder: string,
  productFolder: string,
  fileName: string
) {
  return encodeURI(
    `/companies/${groupFolder}/${companyFolder}/${productFolder}/${fileName}`
  );
}

function ProductImageViewer({
  images,
  alt,
  badgeText,
}: {
  images: string[];
  alt: string;
  badgeText: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const safeImages = images.length > 0 ? images : [];
  const currentImage = safeImages[currentIndex];

  useEffect(() => {
    setCurrentIndex(0);
  }, [images]);

  if (safeImages.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 text-sm text-slate-400">
        No image
      </div>
    );
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative">
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <img src={currentImage} alt={alt} className="h-full w-full object-cover" />
      </div>

      <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
        {badgeText}
      </div>

      {safeImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-sm font-bold text-white transition hover:bg-black/75"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-sm font-bold text-white transition hover:bg-black/75"
          >
            ›
          </button>

          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-black/50 px-2 py-1">
            {safeImages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`h-2.5 w-2.5 rounded-full ${
                  index === currentIndex ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const groups: RankingGroup[] = [
  {
    groupKey: "condiments_oil",
    groupName: "Dầu ăn, nước chấm, gia vị",
    companies: [
      "Công ty Ajinomoto Việt Nam",
      "Công ty Cánh Đồng Vàng (Golden Farm)",
      "Công ty Cổ phần Acecook Việt Nam",
      "Công ty Cổ phần Chế biến Thủy hải sản Liên Thành",
      "Công ty Cổ phần Công nghệ thực phẩm Châu Á (AFOTECH)",
      "Công ty Cổ phần D-SHINING",
      "Công ty Cổ phần Dầu Thực Vật Tường An",
      "Công ty Cổ phần Hàng tiêu dùng Masan",
      "Công ty Cổ phần Thực phẩm Cholimex",
      "Công ty TNHH Calofic",
    ],
  },
  {
    groupKey: "dairy",
    groupName: "Sữa và sản phẩm từ sữa",
    companies: [
      "Công ty CP Sữa Việt Nam",
      "Công ty CP Sữa TH",
      "Công ty TNHH FrieslandCampina Việt Nam",
    ],
  },
  {
    groupKey: "dry_instant",
    groupName: "Thực phẩm khô, đồ ăn liền",
    companies: [
      "Công ty Cổ phần Acecook Việt Nam",
      "Công ty Cổ phần Hàng tiêu dùng Masan",
      "Công ty Cổ phần Uniben",
    ],
  },
];

const productLibrary: Record<string, Record<string, ProductCard[]>> = {
  "Dầu ăn, nước chấm, gia vị": {
    "Công ty Ajinomoto Việt Nam": [
      {
        name: "Bột ngọt hạt lớn Ajinomoto gói 1kg",
        sku: "AJI-001",
        category: "Gia vị",
        packSpec: "Gói 1kg",
        aiStatus: "Matched",
        images: [
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Bột ngọt hạt lớn Ajinomoto gói 1kg",
            "bot-ngot-ajinomoto-goi-1kg-201912111050340356.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Bột ngọt hạt lớn Ajinomoto gói 1kg",
            "bot-ngot-ajinomoto-goi-1kg-201912111050342848.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Bột ngọt hạt lớn Ajinomoto gói 1kg",
            "bot-ngot-ajinomoto-goi-1kg-201912111050344759.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Bột ngọt hạt lớn Ajinomoto gói 1kg",
            "bot-ngot-ajinomoto-goi-1kg-201912111050346970.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Bột ngọt hạt lớn Ajinomoto gói 1kg",
            "bot-ngot-ajinomoto-goi-1kg-201912111050349172.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Bột ngọt hạt lớn Ajinomoto gói 1kg",
            "bot-ngot-hat-lon-ajinomoto-goi-1kg-202202110748243423.jpg"
          ),
        ],
      },
      {
        name: "Bột ngọt hạt lớn Ajinomoto gói 100g",
        sku: "AJI-002",
        category: "Gia vị",
        packSpec: "Gói 100g",
        aiStatus: "Matched",
        images: [
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Bột ngọt hạt lớn Ajinomoto gói 100g",
            "bot-ngot-ajinomoto-goi-100g-202006200905580100.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Bột ngọt hạt lớn Ajinomoto gói 100g",
            "bot-ngot-ajinomoto-goi-100g-202006200905589866.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Bột ngọt hạt lớn Ajinomoto gói 100g",
            "bot-ngot-ajinomoto-goi-100g-202006200905599332.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Bột ngọt hạt lớn Ajinomoto gói 100g",
            "bot-ngot-ajinomoto-goi-100g-202006200906007317.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Bột ngọt hạt lớn Ajinomoto gói 100g",
            "bot-ngot-hat-lon-ajinomoto-goi-100g-202202110757420757.jpg"
          ),
        ],
      },
      {
        name: "Bột ngọt hạt lớn Ajinomoto gói 454g",
        sku: "AJI-003",
        category: "Gia vị",
        packSpec: "Gói 454g",
        aiStatus: "Matched",
        images: [
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Bột ngọt hạt lớn Ajinomoto gói 454g",
            "bot-ngot-ajinomoto-goi-454g-202006172147088307.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Bột ngọt hạt lớn Ajinomoto gói 454g",
            "bot-ngot-ajinomoto-goi-454g-202006172147094901.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Bột ngọt hạt lớn Ajinomoto gói 454g",
            "bot-ngot-ajinomoto-goi-454g-202006172147105798.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Bột ngọt hạt lớn Ajinomoto gói 454g",
            "bot-ngot-ajinomoto-goi-454g-202006172147111232.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Bột ngọt hạt lớn Ajinomoto gói 454g",
            "bot-ngot-hat-lon-goi-454g_202511031322533742.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Bột ngọt hạt lớn Ajinomoto gói 454g",
            "bot-ngot-ajinomoto-hat-lon-goi-454g_202511031327519972.jpg"
          ),
        ],
      },
      {
        name: "Gia vị lẩu nấm Aji-Quick gói 44g",
        sku: "AJI-004",
        category: "Gia vị hoàn chỉnh",
        packSpec: "Gói 44g",
        aiStatus: "Matched",
        images: [
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị lẩu nấm Aji-Quick gói 44g",
            "nuoc-lau-lau-nam-aji-quick-goi-544g_202506231035136200.jpg"
          ),
        ],
      },
      {
        name: "Gia vị nêm sẵn bún riêu cua Aji-Quick gói 54g",
        sku: "AJI-005",
        category: "Gia vị hoàn chỉnh",
        packSpec: "Gói 54g",
        aiStatus: "Matched",
        images: [
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn bún riêu cua Aji-Quick gói 54g",
            "gia-vi-nem-san-bun-rieu-cua-aji-quick-goi-54g-202310231400231271.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn bún riêu cua Aji-Quick gói 54g",
            "gia-vi-nem-san-bun-rieu-cua-aji-quick-goi-54g-202310231400235137.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn bún riêu cua Aji-Quick gói 54g",
            "gia-vi-nem-san-bun-rieu-cua-aji-quick-goi-54g-202310310958367972.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn bún riêu cua Aji-Quick gói 54g",
            "gia-vi-nem-san-bun-rieu-cua-aji-quick-goi-54g-202310310958372127.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn bún riêu cua Aji-Quick gói 54g",
            "gia-vi-nem-san-bun-rieu-cua-aji-quick-goi-54g-202310310958376136.jpg"
          ),
        ],
      },
      {
        name: "Gia vị nêm sẵn cá kho Aji-Quick gói 31g",
        sku: "AJI-006",
        category: "Gia vị hoàn chỉnh",
        packSpec: "Gói 31g",
        aiStatus: "Matched",
        images: [
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn cá kho Aji-Quick gói 31g",
            "206064-ksp_202408290905550253.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn cá kho Aji-Quick gói 31g",
            "gia-vi-nem-san-ca-kho-aji-quick-goi-31g-202407091321136757.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn cá kho Aji-Quick gói 31g",
            "gia-vi-nem-san-ca-kho-aji-quick-goi-31g-202407091321142987.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn cá kho Aji-Quick gói 31g",
            "gia-vi-nem-san-ca-kho-aji-quick-goi-31g-202407091321148878.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn cá kho Aji-Quick gói 31g",
            "gia-vi-nem-san-ca-kho-aji-quick-goi-31g-202407091321157181.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn cá kho Aji-Quick gói 31g",
            "gia-vi-nem-san-ca-kho-aji-quick-goi-31g-202407091321164273.jpg"
          ),
        ],
      },
      {
        name: "Gia vị nêm sẵn nấu bún bò Huế Aji-Quick gói 59g",
        sku: "AJI-007",
        category: "Gia vị hoàn chỉnh",
        packSpec: "Gói 59g",
        aiStatus: "Matched",
        images: [
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn nấu bún bò Huế Aji-Quick gói 59g",
            "gia-vi-nem-san-nau-bun-bo-hue-aji-quick-goi-59g-201909251523183669.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn nấu bún bò Huế Aji-Quick gói 59g",
            "gia-vi-nem-san-nau-bun-bo-hue-aji-quick-goi-59g-201909251523247009.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn nấu bún bò Huế Aji-Quick gói 59g",
            "gia-vi-nem-san-nau-bun-bo-hue-aji-quick-goi-59g-201909251523282841.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn nấu bún bò Huế Aji-Quick gói 59g",
            "gia-vi-nem-san-nau-bun-bo-hue-aji-quick-goi-59g-201909251523328570.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn nấu bún bò Huế Aji-Quick gói 59g",
            "sellingpoint.jpg"
          ),
        ],
      },
      {
        name: "Gia vị nêm sẵn thịt kho Aji-Quick gói 31g",
        sku: "AJI-008",
        category: "Gia vị hoàn chỉnh",
        packSpec: "Gói 31g",
        aiStatus: "Matched",
        images: [
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn thịt kho Aji-Quick gói 31g",
            "gia-vi-nem-san-thit-kho-aji-quick-goi-31g-202312051438481310.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn thịt kho Aji-Quick gói 31g",
            "gia-vi-nem-san-thit-kho-aji-quick-goi-31g-202407091135077531.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn thịt kho Aji-Quick gói 31g",
            "gia-vi-nem-san-thit-kho-aji-quick-goi-31g-202407091135087156.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn thịt kho Aji-Quick gói 31g",
            "gia-vi-nem-san-thit-kho-aji-quick-goi-31g-202407091135097311.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Gia vị nêm sẵn thịt kho Aji-Quick gói 31g",
            "gia-vi-nem-san-thit-kho-aji-quick-goi-31g-202407091135106847.jpg"
          ),
        ],
      },
      {
        name: "Giấm gạo lên men Ajinomoto chai 400ml",
        sku: "AJI-009",
        category: "Gia vị",
        packSpec: "Chai 400ml",
        aiStatus: "Matched",
        images: [
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Giấm gạo lên men Ajinomoto chai 400ml",
            "giam-gao-len-men-ajinomoto-chai-400ml-202006271626193612.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Giấm gạo lên men Ajinomoto chai 400ml",
            "giam-gao-len-men-ajinomoto-chai-400ml-202006271626197385.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Giấm gạo lên men Ajinomoto chai 400ml",
            "giam-gao-len-men-ajinomoto-chai-400ml-202006271626200607.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Giấm gạo lên men Ajinomoto chai 400ml",
            "giam-gao-len-men-ajinomoto-chai-400ml-202006271626203859.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Giấm gạo lên men Ajinomoto chai 400ml",
            "sellingpoint.jpg"
          ),
        ],
      },
      {
        name: "Hạt nêm Aji-ngon vị heo gói 170g",
        sku: "AJI-010",
        category: "Hạt nêm",
        packSpec: "Gói 170g",
        aiStatus: "Matched",
        images: [
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Hạt nêm Aji-ngon vị heo gói 170g",
            "177826-slide-moi_202409271647007891.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Hạt nêm Aji-ngon vị heo gói 170g",
            "hat-nem-aji-ngon-vi-heo-goi-170g-202006172145128407.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Hạt nêm Aji-ngon vị heo gói 170g",
            "hat-nem-aji-ngon-vi-heo-goi-170g-202407021018299777.jpg"
          ),
        ],
      },
      {
        name: "Hạt nêm Aji-ngon vị heo gói 400g",
        sku: "AJI-011",
        category: "Hạt nêm",
        packSpec: "Gói 400g",
        aiStatus: "Matched",
        images: [
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Hạt nêm Aji-ngon vị heo gói 400g",
            "82259-mat-sau_202409300935243227.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Hạt nêm Aji-ngon vị heo gói 400g",
            "82259-slide_202409300935247986.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Hạt nêm Aji-ngon vị heo gói 400g",
            "82259-slide-moi_202409300935251423.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Hạt nêm Aji-ngon vị heo gói 400g",
            "hat-nem-vi-heo-aji-ngon-goi-400g-202303281033540192.jpg"
          ),
        ],
      },
      {
        name: "Hạt nêm Aji-ngon vị heo gói 900g",
        sku: "AJI-012",
        category: "Hạt nêm",
        packSpec: "Gói 900g",
        aiStatus: "Matched",
        images: [
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Hạt nêm Aji-ngon vị heo gói 900g",
            "77238-slide_202409300925114415.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Hạt nêm Aji-ngon vị heo gói 900g",
            "77238-slide-moi_202409300922444575.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Hạt nêm Aji-ngon vị heo gói 900g",
            "77238-slidee_202409300922440802.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Hạt nêm Aji-ngon vị heo gói 900g",
            "77238-tem_202411191421591446.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Hạt nêm Aji-ngon vị heo gói 900g",
            "77238-tem-2_202411191422000074.jpg"
          ),
        ],
      },
      {
        name: "Xốt mayonnaise Ajinomoto Aji-mayo chưa béo chai 130g",
        sku: "AJI-013",
        category: "Xốt",
        packSpec: "Chai 130g",
        aiStatus: "Matched",
        images: [
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Xốt mayonnaise Ajinomoto Aji-mayo chua béo chai 130g",
            "xot-mayonnaise-ajinomoto-aji-mayo-chua-beo-chai-130g-202407121516090787.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Xốt mayonnaise Ajinomoto Aji-mayo chua béo chai 130g",
            "xot-mayonnaise-ajinomoto-aji-mayo-chua-beo-chai-130g-202407121516092767.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Xốt mayonnaise Ajinomoto Aji-mayo chua béo chai 130g",
            "xot-mayonnaise-ajinomoto-aji-mayo-chua-beo-chai-130g-202407121516094683.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Xốt mayonnaise Ajinomoto Aji-mayo chua béo chai 130g",
            "xot-mayonnaise-ajinomoto-aji-mayo-chua-beo-chai-130g-202407121516096578.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Xốt mayonnaise Ajinomoto Aji-mayo chua béo chai 130g",
            "xot-mayonnaise-ajinomoto-aji-mayo-chua-beo-chai-130g-202407121516098318.jpg"
          ),
        ],
      },
      {
        name: "Xốt mayonnaise Ajinomoto Aji-mayo chua béo chai 260g",
        sku: "AJI-014",
        category: "Xốt",
        packSpec: "Chai 260g",
        aiStatus: "Matched",
        images: [
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Xốt mayonnaise Ajinomoto Aji-mayo chua béo chai 260g",
            "xot-mayonnaise-ajinomoto-vi-chua-beo-chai-260g-202304241647567247.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Xốt mayonnaise Ajinomoto Aji-mayo chua béo chai 260g",
            "xot-mayonnaise-ajinomoto-vi-chua-beo-chai-260g-202304241648090871.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Xốt mayonnaise Ajinomoto Aji-mayo chua béo chai 260g",
            "xot-mayonnaise-ajinomoto-vi-chua-beo-chai-260g-202304241648093197.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Xốt mayonnaise Ajinomoto Aji-mayo chua béo chai 260g",
            "xot-mayonnaise-ajinomoto-vi-chua-beo-chai-260g-202304241648095255.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Xốt mayonnaise Ajinomoto Aji-mayo chua béo chai 260g",
            "xot-mayonnaise-ajinomoto-vi-chua-beo-chai-260g-202308091620330952.jpg"
          ),
        ],
      },
      {
        name: "Xốt mayonnaise Ajinomoto Aji-mayo chua béo chai 430g",
        sku: "AJI-015",
        category: "Xốt",
        packSpec: "Chai 430g",
        aiStatus: "Matched",
        images: [
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Xốt mayonnaise Ajinomoto Aji-mayo chua béo chai 430g",
            "330057-slide_202409191354134317.jpg"
          ),
        ],
      },
      {
        name: "Xốt mayonnaise Ajinomoto Aji-mayo ngọt dịu chai 130g",
        sku: "AJI-016",
        category: "Xốt",
        packSpec: "Chai 130g",
        aiStatus: "Matched",
        images: [
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Xốt mayonnaise Ajinomoto Aji-mayo ngọt dịu chai 130g",
            "sot-mayonnaise-aji-mayo-ajinomoto-ngot-diu-chai-130g-202006200920242937.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Xốt mayonnaise Ajinomoto Aji-mayo ngọt dịu chai 130g",
            "sot-mayonnaise-aji-mayo-ajinomoto-ngot-diu-chai-130g-202006200920249161.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Xốt mayonnaise Ajinomoto Aji-mayo ngọt dịu chai 130g",
            "sot-mayonnaise-aji-mayo-ajinomoto-ngot-diu-chai-130g-202006200920258897.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Xốt mayonnaise Ajinomoto Aji-mayo ngọt dịu chai 130g",
            "sot-mayonnaise-aji-mayo-ajinomoto-ngot-diu-chai-130g-202006200920263780.jpg"
          ),
          productImagePath(
            "Dầu ăn, nước chấm, gia vị",
            "Công ty Ajinomoto Việt Nam",
            "Xốt mayonnaise Ajinomoto Aji-mayo ngọt dịu chai 130g",
            "sot-mayonnaise-aji-mayo-ajinomoto-ngot-diu-chai-130g-202202162253503063.jpg"
          ),
        ],
      },
    ],
  },
};

function getProducts(groupName: string, companyName: string): ProductCard[] {
  return productLibrary[groupName]?.[companyName] ?? [];
}

function statusClass(status: ProductCard["aiStatus"]) {
  if (status === "Matched") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "Review") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-red-200 bg-red-50 text-red-700";
}

export default function DashboardPage() {
  const [language, setLanguage] = useState<Language>("vi");
  const [selectedGroupKey, setSelectedGroupKey] = useState("condiments_oil");
  const [selectedCompany, setSelectedCompany] = useState("Công ty Ajinomoto Việt Nam");

  const t = useMemo(() => content[language], [language]);

  const currentGroup = useMemo(() => {
    return groups.find((item) => item.groupKey === selectedGroupKey) ?? groups[0];
  }, [selectedGroupKey]);

  useEffect(() => {
    setSelectedCompany(currentGroup.companies[0]);
  }, [currentGroup]);

  const productCards = useMemo(() => {
    return getProducts(currentGroup.groupName, selectedCompany);
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
                <h3 className="text-xl font-bold text-slate-900">{t.groupsTitle}</h3>
                <p className="mt-1 text-sm text-slate-500">{t.groupsDesc}</p>

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
                      {groups.map((group) => (
                        <option key={group.groupKey} value={group.groupKey}>
                          {group.groupName}
                        </option>
                      ))}
                    </select>
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
                    {t.selectedCompany}: {selectedCompany}
                  </div>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {productCards.length > 0 ? (
                    productCards.map((product) => (
                      <div
                        key={product.sku}
                        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                      >
                        <ProductImageViewer
                          images={product.images}
                          alt={product.name}
                          badgeText={`${product.images.length} ${t.imageCount}`}
                        />

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

                          <button
                            type="button"
                            className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            {t.open}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
                      {t.noProducts}
                    </div>
                  )}
                </div>
              </section>
            </div>

            <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{t.companyList}</h3>
                  <p className="mt-1 text-sm text-slate-500">{t.companyListDesc}</p>
                </div>
                <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                  {currentGroup.companies.length} công ty
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-sm text-slate-500">
                      <th className="px-3 py-3 font-semibold">{t.rank}</th>
                      <th className="px-3 py-3 font-semibold">{t.companyName}</th>
                      <th className="px-3 py-3 font-semibold">{t.sectorName}</th>
                      <th className="px-3 py-3 font-semibold">{t.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentGroup.companies.map((company, index) => (
                      <tr key={company} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-4 font-semibold text-slate-900">{index + 1}</td>
                        <td className="px-3 py-4 font-semibold text-slate-900">{company}</td>
                        <td className="px-3 py-4 text-slate-600">{currentGroup.groupName}</td>
                        <td className="px-3 py-4">
                          <button
                            type="button"
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