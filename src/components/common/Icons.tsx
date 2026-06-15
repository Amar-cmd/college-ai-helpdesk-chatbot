import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function SendIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M5 12L3.4 5.2C3.15 4.14 4.22 3.28 5.2 3.76L20.3 11.1C21.23 11.55 21.23 12.45 20.3 12.9L5.2 20.24C4.22 20.72 3.15 19.86 3.4 18.8L5 12ZM5 12H13.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BookOpenIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M12 6.5C10.7 5.55 8.75 5 6.7 5H5.5C4.67 5 4 5.67 4 6.5V18C4 18.55 4.45 19 5 19H6.7C8.75 19 10.7 19.55 12 20.5M12 6.5C13.3 5.55 15.25 5 17.3 5H18.5C19.33 5 20 5.67 20 6.5V18C20 18.55 19.55 19 19 19H17.3C15.25 19 13.3 19.55 12 20.5M12 6.5V20.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ActivityIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M4 12H8L10 5L14 19L16 12H20"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}