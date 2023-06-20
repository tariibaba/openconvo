import { MouseEventHandler, ReactElement } from 'react';

interface Props {
  handleClick: MouseEventHandler<HTMLButtonElement>;
  children: ReactElement;
}

const SidebarActionButton = ({ handleClick, children }: Props) => (
  <button
    className="min-w-[20px] p-1 text-black dark:text-gray-300 hover:text-black/60 dark:hover:text-neutral-100"
    onClick={handleClick}
  >
    {children}
  </button>
);

export default SidebarActionButton;
