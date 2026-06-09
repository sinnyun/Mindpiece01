# React Hooks 进阶指南

本文总结了深入使用 Hooks 的场景与优化方式。

## `useEffect` 的依赖项管理

当依赖项为对象或数组时，推荐使用 `useMemo` 或提取到组件外部。

## 视频笔记要点

- 不要将所有状态合并为一个大的 `useState`。
- 使用 `useCallback` 缓存传递给子组件的函数。
