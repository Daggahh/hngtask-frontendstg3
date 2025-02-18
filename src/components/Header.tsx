import React from "react";
import Switch from "./switch";
import logo from "../../public/textai.svg";
import Image from "next/image";
import Link from "next/link";

const Header = () => {
  return (
    <div className="flex justify-between items-center p-6 bg-white dark:bg-gray-900">
      <Link href="/">
        <div className="flex items-center space-x-2">
          <Image
            src={logo}
            alt="AIFlow Logo"
            width={40}
            height={40}
            className="filter dark:invert dark:brightness-0 dark:contrast-100"
          />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            AIFlow
          </h1>
        </div>
      </Link>
      <Switch />
    </div>
  );
};

export default Header;
