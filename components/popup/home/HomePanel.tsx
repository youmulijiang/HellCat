import React from 'react';
import { GithubOutlined, UserOutlined } from '@ant-design/icons';

export const HomePanel: React.FC = () => {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden px-6 py-6">
      <div className="flex w-full max-w-md flex-col items-center justify-center pb-10">
        <div className="flex w-full items-center justify-center">
          <img
            src="/icon/logo.png"
            alt="Hellcat Logo"
            className="max-h-[42vh] w-full max-w-[300px] object-contain select-none"
          />
        </div>

        <div className="mt-5 flex flex-col items-center text-center">
          <h1 className="m-0 text-[2.25rem] font-bold leading-none tracking-[0.02em] text-slate-800">
            Hellcat
          </h1>
          <p className="mt-2 m-0 text-sm leading-6 text-slate-400">
            浏览器安全测试工具箱
          </p>
          <a
            href="https://github.com/youmulijiang/Hellcat"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700"
          >
            <GithubOutlined />
            柚木梨酱
          </a>
        </div>
      </div>
    </div>
  );
};

