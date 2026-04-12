'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ReactNode } from 'react';

type Lang = 'mn' | 'en';

const content = {
  mn: {
    title: 'Нууцлалын бодлого',
    lastUpdated: 'Сүүлд шинэчлэгдсэн: 2026-04-13',
    toc: 'Агуулга',
    backToSignIn: 'Нэвтрэх хуудас руу буцах',
    sections: [
      {
        id: 'overview',
        label: 'Ерөнхий',
        title: 'Ерөнхий мэдээлэл',
        content: (
          <>
            <p>
              Энэхүү Нууцлалын бодлого нь Харилцагч та (цаашид &quot;Та&quot; гэх)-нд GRHOG ухаалаг хогийн сав -ийн үйлчилгээг Үйлчилгээний нөхцөлийн дагуу үзүүлэхтэй холбоотойгоор хэрэглэгчийн мэдээллийг цуглуулах, ашиглах, хадгалах зэрэг харилцааг зохицуулах баримт бичиг болно.
            </p>
            <p className='mt-2'>
              GRHOG систем нь вэб платформ (www.grhog.mn), мобайл аппликейшн (Android, iOS) болон серверийн хэсгээс бүрдэх цогц систем юм.
            </p>
          </>
        ),
      },
      {
        id: 'security',
        label: 'Аюулгүй байдал',
        title: 'Нууц үг ба аюулгүй байдал',
        content: (
          <>
            <p>
              Хэрэглэгч системд бүртгүүлэх болон хэрэглэгчийн үүсгэсэн нууц үг системд хадгалагдана. Хэрэглэгчийн оруулсан нууц үгийг систем шифрлэн кодчилж хадгалах учир хэрэглэгчээс өөр хэн ч нууц үгийг мэдэх боломжгүй.
            </p>
            <p className='mt-2'>
              www.grhog.mn нь таны хандах эрхийг ашиглан таны мэдээлэлд нэвтрэх боломжгүй болно.
            </p>
          </>
        ),
      },
      {
        id: 'data-usage',
        label: 'Мэдээллийн ашиглалт',
        title: 'Мэдээллийн ашиглалт ба гуравдагч этгээд',
        content: (
          <p>
            www.grhog.mn сайт нь хэрэглэгчийн хувийн мэдээллийг гуравдагч этгээдэд ашиглуулахгүй, түгээхгүй бөгөөд өөрсдийн байрлалын хогийн савны мэдээлэл болон ашигласан мэдээллээ харах зорилгоор ашиглана.
          </p>
        ),
      },
      {
        id: 'responsibility',
        label: 'Хариуцлага',
        title: 'Хэрэглэгчийн үүрэг, хариуцлага',
        content: (
          <>
            <p>
              Хэрэглэгч өөрийн нэвтрэх нэр, нууц үгийн нууцлал, аюулгүй байдлыг зөвхөн өөрөө хариуцах бөгөөд нэвтрэх нэр, нууц үгээ ямар ч тохиолдолд гуравдагч этгээдэд дамжуулахгүй байх үүрэгтэй.
            </p>
            <p className='mt-2'>
              Хэрэглэгч өөрийн буруутай үйлдлээс хамаарч нэвтрэх нэр, нууц үгээ бусдад мэдэгдэж, үүнээс үүссэн хохирол, хариуцлагыг хэрэглэгч өөрөө бүрэн хариуцна.
            </p>
          </>
        ),
      },
      {
        id: 'collected-data',
        label: 'Цуглуулах мэдээлэл',
        title: 'Цуглуулах мэдээлэл',
        content: (
          <>
            <p className='font-medium text-foreground'>Хувийн мэдээлэл:</p>
            <ul className='mt-1 list-disc pl-5 space-y-1'>
              <li>И-мэйл хаяг</li>
              <li>Нэр, овог</li>
              <li>Нэвтрэх нууц үг (шифрлэгдсэн хэлбэрээр)</li>
              <li>Утасны дугаар</li>
            </ul>
            <p className='mt-4 font-medium text-foreground'>Төхөөрөмжийн мэдээлэл (Мобайл апп):</p>
            <ul className='mt-1 list-disc pl-5 space-y-1'>
              <li>Биометрик мэдээлэл (хурууны хээ, нүүр таних) — зөвхөн төхөөрөмж дотор, серверт илгээгдэхгүй</li>
              <li>NFC карт уншигчийн мэдээлэл</li>
              <li>Байршлын мэдээлэл (газрын зурагтай холбоотой)</li>
              <li>Push мэдэгдлийн токен</li>
            </ul>
            <p className='mt-4 font-medium text-foreground'>Ашиглалтын мэдээлэл:</p>
            <ul className='mt-1 list-disc pl-5 space-y-1'>
              <li>Системд нэвтэрсэн түүх, огноо, цаг</li>
              <li>Хог хаягдлын бүртгэл, түүх</li>
              <li>Хогийн савны байрлал, ашиглалтын мэдээлэл</li>
            </ul>
          </>
        ),
      },
      {
        id: 'permissions',
        label: 'Зөвшөөрлүүд',
        title: 'Мобайл аппликейшний зөвшөөрлүүд',
        content: (
          <>
            <p>GRHOG мобайл апп нь дараах зөвшөөрлийг хүсэх боломжтой:</p>
            <ul className='mt-2 list-disc pl-5 space-y-1'>
              <li>Биометрик — аппд нэвтрэхэд хурууны хээ эсвэл нүүр танилтаар баталгаажуулах</li>
              <li>NFC — ажилтны карт уншуулах, бүртгэл хийх</li>
              <li>Байршил — газрын зурган дээр мэдээлэл харуулах</li>
              <li>Мэдэгдэл — системийн мэдэгдлүүдийг хүлээн авах</li>
              <li>Интернет — сервертэй холбогдох</li>
            </ul>
            <p className='mt-2'>
              Та төхөөрөмжийн тохиргооноос хүссэн үедээ зөвшөөрлийг цуцлах боломжтой.
            </p>
          </>
        ),
      },
      {
        id: 'protection',
        label: 'Хамгаалалт',
        title: 'Мэдээллийн хамгаалалт',
        content: (
          <ul className='list-disc pl-5 space-y-1'>
            <li>Нууц үг нь шифрлэгдсэн хэлбэрээр хадгалагдана</li>
            <li>Сервер болон клиент хоорондын харилцаа SSL/TLS шифрлэлтээр хамгаалагдана</li>
            <li>Биометрик мэдээлэл зөвхөн таны төхөөрөмж дотор боловсруулагдаж, серверт хадгалагдахгүй</li>
            <li>JWT токен ашиглан нэвтрэлтийг баталгаажуулна</li>
          </ul>
        ),
      },
      {
        id: 'rights',
        label: 'Хэрэглэгчийн эрх',
        title: 'Хэрэглэгчийн эрх',
        content: (
          <>
            <p>Та дараах эрхтэй:</p>
            <ul className='mt-2 list-disc pl-5 space-y-1'>
              <li>Өөрийн мэдээлэлтэй танилцах</li>
              <li>Мэдээллээ засварлах, шинэчлэх</li>
              <li>Бүртгэлээ устгах хүсэлт гаргах</li>
            </ul>
          </>
        ),
      },
      {
        id: 'changes',
        label: 'Өөрчлөлт',
        title: 'Бодлогын өөрчлөлт',
        content: (
          <p>
            Энэхүү нууцлалын бодлогод өөрчлөлт оруулах эрхтэй бөгөөд өөрчлөлт орсон тохиолдолд апп болон вэб платформоор дамжуулан хэрэглэгчдэд мэдэгдэнэ.
          </p>
        ),
      },
      {
        id: 'contact',
        label: 'Холбоо барих',
        title: 'Холбоо барих',
        content: (
          <>
            <p>
              Нууцлалын бодлоготой холбоотой асуулт, хүсэлт, гомдол байвал дараах хаягаар холбогдоно уу.
            </p>
            <ul className='mt-2 list-disc pl-5 space-y-1'>
              <li>admin@grhog.com</li>
              <li>+976 99933857</li>
            </ul>
          </>
        ),
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: 2026-04-13',
    toc: 'Contents',
    backToSignIn: 'Back to Sign In',
    sections: [
      {
        id: 'overview',
        label: 'Overview',
        title: 'Overview',
        content: (
          <>
            <p>
              This Privacy Policy governs the collection, use, and storage of user information in connection with providing the GRHOG smart waste bin service to you (hereinafter &quot;You&quot;) in accordance with the Terms of Service.
            </p>
            <p className='mt-2'>
              The GRHOG system consists of a web platform (www.grhog.mn), mobile application (Android, iOS), and backend server.
            </p>
          </>
        ),
      },
      {
        id: 'security',
        label: 'Security',
        title: 'Password & Security',
        content: (
          <>
            <p>
              When a user registers, the password created is stored in the system. The system encrypts and encodes the password, making it impossible for anyone other than the user to know it.
            </p>
            <p className='mt-2'>
              www.grhog.mn cannot access your information using your access credentials.
            </p>
          </>
        ),
      },
      {
        id: 'data-usage',
        label: 'Data Usage',
        title: 'Data Usage & Third Parties',
        content: (
          <p>
            www.grhog.mn will not share or distribute user personal information to third parties. The information is used solely for the purpose of viewing your waste bin location data and usage history.
          </p>
        ),
      },
      {
        id: 'responsibility',
        label: 'Responsibility',
        title: 'User Responsibility',
        content: (
          <>
            <p>
              The user is solely responsible for the confidentiality and security of their login credentials and must not share them with any third party under any circumstances.
            </p>
            <p className='mt-2'>
              If the user discloses their login credentials to others through their own fault, the user bears full responsibility for any resulting damages or liabilities.
            </p>
          </>
        ),
      },
      {
        id: 'collected-data',
        label: 'Collected Data',
        title: 'Collected Data',
        content: (
          <>
            <p className='font-medium text-foreground'>Personal Information:</p>
            <ul className='mt-1 list-disc pl-5 space-y-1'>
              <li>Email address</li>
              <li>First and last name</li>
              <li>Login password (stored in encrypted form)</li>
              <li>Phone number</li>
            </ul>
            <p className='mt-4 font-medium text-foreground'>Device Information (Mobile App):</p>
            <ul className='mt-1 list-disc pl-5 space-y-1'>
              <li>Biometric data (fingerprint, face recognition) — processed locally on device only, never sent to server</li>
              <li>NFC card reader data</li>
              <li>Location data (map-related features)</li>
              <li>Push notification token</li>
            </ul>
            <p className='mt-4 font-medium text-foreground'>Usage Information:</p>
            <ul className='mt-1 list-disc pl-5 space-y-1'>
              <li>Login history, date, and time</li>
              <li>Waste collection records and history</li>
              <li>Waste bin location and usage data</li>
            </ul>
          </>
        ),
      },
      {
        id: 'permissions',
        label: 'Permissions',
        title: 'Mobile App Permissions',
        content: (
          <>
            <p>The GRHOG mobile app may request the following permissions:</p>
            <ul className='mt-2 list-disc pl-5 space-y-1'>
              <li>Biometric — authenticate via fingerprint or face recognition</li>
              <li>NFC — scan employee cards, register attendance</li>
              <li>Location — display information on map</li>
              <li>Notifications — receive system notifications</li>
              <li>Internet — connect to server</li>
            </ul>
            <p className='mt-2'>
              You can revoke permissions at any time from your device settings.
            </p>
          </>
        ),
      },
      {
        id: 'protection',
        label: 'Protection',
        title: 'Data Protection',
        content: (
          <ul className='list-disc pl-5 space-y-1'>
            <li>Passwords are stored in encrypted (hashed) form</li>
            <li>Server-client communication is protected by SSL/TLS encryption</li>
            <li>Biometric data is processed only on your device and never stored on the server</li>
            <li>Authentication is verified using JWT tokens</li>
          </ul>
        ),
      },
      {
        id: 'rights',
        label: 'User Rights',
        title: 'User Rights',
        content: (
          <>
            <p>You have the following rights:</p>
            <ul className='mt-2 list-disc pl-5 space-y-1'>
              <li>Access your personal information</li>
              <li>Edit and update your information</li>
              <li>Request account deletion</li>
            </ul>
          </>
        ),
      },
      {
        id: 'changes',
        label: 'Changes',
        title: 'Policy Changes',
        content: (
          <p>
            We reserve the right to modify this privacy policy. Users will be notified of any changes through the app and web platform.
          </p>
        ),
      },
      {
        id: 'contact',
        label: 'Contact',
        title: 'Contact',
        content: (
          <>
            <p>
              For questions, requests, or complaints regarding this privacy policy, please contact us at:
            </p>
            <ul className='mt-2 list-disc pl-5 space-y-1'>
              <li>admin@grhog.com</li>
              <li>+976 99933857</li>
            </ul>
          </>
        ),
      },
    ],
  },
};

function Collapsible({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div id={id} className='border-b'>
      <button
        onClick={() => setOpen(!open)}
        className='flex w-full items-center gap-3 py-4 text-left transition-colors hover:bg-muted/50'
      >
        <span className='flex-1 text-sm font-semibold'>{title}</span>
        <span className='text-muted-foreground text-xs'>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className='pb-4 pl-4 pr-4 text-sm text-muted-foreground leading-relaxed'>
          {children}
        </div>
      )}
    </div>
  );
}

export default function PrivacyPolicyPage() {
  const [lang, setLang] = useState<Lang>('mn');
  const t = content[lang];

  return (
    <div className='h-screen overflow-y-auto'>
      <div className='mx-auto max-w-6xl px-4 py-10 lg:grid lg:grid-cols-[220px_1fr] lg:gap-10'>
        {/* Sidebar */}
        <aside className='hidden lg:block'>
          <div className='sticky top-10'>
            <p className='mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              {t.toc}
            </p>
            <nav className='space-y-1'>
              {t.sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className='block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                >
                  {s.label}
                </a>
              ))}
            </nav>
            <div className='mt-6 border-t pt-4'>
              <Link
                href='/auth/sign-in'
                className='text-xs text-muted-foreground underline underline-offset-4 hover:text-primary'
              >
                {t.backToSignIn}
              </Link>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className='min-w-0'>
          <div className='mb-6 flex items-center justify-between border-b pb-6'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>{t.title}</h1>
              <p className='mt-2 text-sm text-muted-foreground'>{t.lastUpdated}</p>
            </div>
            <div className='flex gap-1 rounded-md border p-1'>
              <button
                onClick={() => setLang('mn')}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${lang === 'mn' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                MN
              </button>
              <button
                onClick={() => setLang('en')}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                EN
              </button>
            </div>
          </div>

          <div>
            {t.sections.map((s) => (
              <Collapsible key={s.id} id={s.id} title={s.title}>
                {s.content}
              </Collapsible>
            ))}
          </div>

          <div className='mt-10 pb-8 lg:hidden'>
            <Link
              href='/auth/sign-in'
              className='text-sm underline underline-offset-4 hover:text-primary'
            >
              {t.backToSignIn}
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
