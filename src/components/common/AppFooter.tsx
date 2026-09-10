import Image from "next/image";
import Link from "next/link";
import { FaFacebook, FaTiktok, FaYoutube } from "react-icons/fa";
import { SiZalo } from "react-icons/si";

const aboutLinks = ["Giới thiệu", "Tuyển dụng", "Liên hệ"];
const policyLinks = ["Chính sách bảo hành", "Chính sách giao hàng", "Chính sách bảo mật"];
const infoLinks = [
  "Hệ thống cửa hàng",
  "Hướng dẫn mua hàng",
  "Hướng dẫn thanh toán",
  "Hướng dẫn trả góp",
  "Tra cứu địa chỉ bảo hành",
  "Build PC",
];

function FooterLinkList({ links }: { links: string[] }) {
  return (
    <ul className="mt-3 space-y-2 text-sm text-gray-300">
      {links.map((label) => (
        <li key={label}>
          <Link href="#" className="transition hover:text-white hover:underline">
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function AppFooter() {
  return (
    <footer className="bg-[#111] text-white">
      <div className="container-shell py-8 lg:py-10">
        <div className="grid gap-8 border-b border-white/15 pb-8 sm:grid-cols-2 lg:grid-cols-[1.05fr_1.25fr_0.9fr_1fr_1.15fr] lg:gap-5">
          <div aria-label="Kết nối với GearVN">
            <Image
              src="/logo-gearvn.svg"
              alt="GEARVN"
              width={120}
              height={40}
              className="h-auto w-[110px] brightness-0 invert"
            />
            <h2 className="mt-5 text-sm font-bold uppercase">Kết nối với chúng tôi</h2>
            <div className="mt-3 flex gap-4 text-2xl">
              <a href="https://www.facebook.com/gearvn" aria-label="Facebook GearVN" target="_blank" rel="noreferrer"><FaFacebook /></a>
              <a href="https://www.youtube.com/@gearvn" aria-label="YouTube GearVN" target="_blank" rel="noreferrer"><FaYoutube /></a>
              <a href="https://www.tiktok.com/@gearvn" aria-label="TikTok GearVN" target="_blank" rel="noreferrer"><FaTiktok /></a>
              <a href="https://zalo.me/gearvn" aria-label="Zalo GearVN" target="_blank" rel="noreferrer"><SiZalo /></a>
            </div>
          </div>

          <section>
            <h2 className="text-sm font-bold uppercase">Tổng đài hỗ trợ (8:00 - 21:00)</h2>
            <div className="mt-3 space-y-3 text-sm text-gray-300">
              <p>Tư vấn mua hàng <a href="tel:19005301" className="block font-bold text-white hover:underline">1900.5301</a></p>
              <p>Hỗ trợ kỹ thuật, bảo hành <a href="tel:19005325" className="block font-bold text-white hover:underline">1900.5325</a></p>
              <p>Góp ý, khiếu nại <a href="tel:18006173" className="block font-bold text-white hover:underline">1800.6173</a></p>
              <p>Email <a href="mailto:cskh@gearvn.com" className="block font-bold text-white hover:underline">cskh@gearvn.com</a></p>
            </div>
          </section>

          <div className="space-y-7">
            <section>
              <h2 className="text-sm font-bold uppercase">Về GearVN</h2>
              <FooterLinkList links={aboutLinks} />
            </section>
            <section>
              <h2 className="text-sm font-bold uppercase">Chính sách</h2>
              <FooterLinkList links={policyLinks} />
            </section>
          </div>

          <section id="showroom">
            <h2 className="text-sm font-bold uppercase">Thông tin</h2>
            <FooterLinkList links={infoLinks} />
          </section>

          <div className="space-y-6">
            <section>
              <h2 className="text-sm font-bold uppercase">Hỗ trợ thanh toán</h2>
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {Array.from({ length: 8 }, (_, index) => (
                  <span key={index} className="flex h-8 items-center justify-center overflow-hidden rounded bg-white">
                    <Image src={`/pay-${index + 1}.png`} alt={`Phương thức thanh toán ${index + 1}`} width={50} height={30} className="h-full w-full object-contain" />
                  </span>
                ))}
              </div>
            </section>
            <section>
              <h2 className="text-sm font-bold uppercase">Đơn vị vận chuyển</h2>
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {Array.from({ length: 4 }, (_, index) => (
                  <span key={index} className="flex h-8 items-center justify-center overflow-hidden rounded bg-white">
                    <Image src={`/ship-${index + 1}.png`} alt={`Đơn vị vận chuyển ${index + 1}`} width={50} height={30} className="h-full w-full object-contain" />
                  </span>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-5 text-xs leading-5 text-gray-300 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-4xl">
            Công ty TNHH Thương Mại GearVN. MST/GCN ĐKDN: 0316517394, cấp ngày 01/10/2020. Địa chỉ: 82 Hoàng Hoa Thám, Phường Bảy Hiền, Thành phố Hồ Chí Minh.
          </p>
          <Image src="/bct-logo.png" alt="Đã thông báo Bộ Công Thương" width={112} height={42} className="h-[42px] w-[112px] object-contain" />
        </div>
      </div>
    </footer>
  );
}
