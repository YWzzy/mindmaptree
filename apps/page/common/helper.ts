import { isMobile } from "../../core/src/helper";

/**
 * 获取URL查询参数的值
 * @param {string} key - 查询参数的键
 * @returns {string} - 查询参数的值，如果没有该参数则返回空字符串
 */
export const getQuery = (key: string): string => {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  return params[key] || "";
};

/**
 * 创建并添加一个GitHub链接到页面
 */
export const createGithubLink = () => {
  // 创建一个div元素作为GitHub链接的容器
  const githubLink = document.createElement("div");
  githubLink.classList.add("github-link");

  // 创建一个a元素作为GitHub图标的链接
  const githubIcon = document.createElement("a");
  githubIcon.classList.add("github-icon");
  githubIcon.href = "https://github.com/YWzzy/mindmaptree";

  // 根据设备类型添加不同的样式
  if (isMobile) {
    githubLink.classList.add("mobile");
  }

  // 将GitHub图标链接添加到GitHub链接容器中
  githubLink.appendChild(githubIcon);

  // 将GitHub链接容器添加到页面主体中
  document.body.appendChild(githubLink);
};
