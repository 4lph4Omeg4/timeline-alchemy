
import React from 'react';

const RegenerateIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.62 3.012a.75.75 0 0 1 1.055.053l2.813 3.375a.75.75 0 0 1-.9 1.202l-1.338-.669a7.5 7.5 0 1 1-3.9-10.916.75.75 0 1 1 .84 1.144A6 6 0 1 0 18 12.5a.75.75 0 0 1 1.5 0A7.5 7.5 0 1 1 11.62 3.012Zm3.13 1.488a.75.75 0 0 1 .75.75v3.375a.75.75 0 0 1-1.5 0V6.31l-.64.32a.75.75 0 0 1-.9-1.202l2.25-1.125a.75.75 0 0 1 .54-.04Z"
    />
  </svg>
);

export default RegenerateIcon;
