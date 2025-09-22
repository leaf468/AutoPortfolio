import React from 'react';

interface ResumeCardProps {
  logoUrl?: string;
  altText: string;
  title: string;
  subtitle?: string;
  href?: string;
  badges?: readonly string[];
  period: string;
  description?: string;
}

const ResumeCard: React.FC<ResumeCardProps> = ({
  logoUrl,
  altText,
  title,
  subtitle,
  href,
  badges,
  period,
  description,
}) => {
  const content = (
    <>
      <div className="flex items-center justify-between gap-x-2 text-base">
        <div className="flex items-center gap-x-3">
          {logoUrl && (
            <div className="flex-shrink-0">
              <img
                src={logoUrl}
                alt={altText}
                className="h-10 w-10 rounded-lg object-contain"
              />
            </div>
          )}
          <div>
            <h3 className="inline-flex items-center justify-center font-semibold leading-none">
              {title}
              {badges && (
                <span className="ml-2 space-x-1">
                  {badges.map((badge, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800"
                    >
                      {badge}
                    </span>
                  ))}
                </span>
              )}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="text-sm tabular-nums text-gray-500 dark:text-gray-400">
          {period}
        </div>
      </div>
      {description && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}
    </>
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
};

export default ResumeCard;