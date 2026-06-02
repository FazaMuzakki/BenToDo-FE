const PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const publicAsset = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${PUBLIC_BASE_PATH}${normalizedPath}`;
};

export const LOGO_SRC = publicAsset("/Logo BenTodo.png");
