# 完整过程档案

**当前状态：分包上传中。下面链接在对应上传完成后可下载；远端完整性核验记录将在全部完成后提交。**

本目录的清单和核验记录用于核对公开 checkpoint Release。该检查点保留了被否决的旧版、测试、未完成渲染和源代码；不代表成片完成。

原始文件数：295；原始总大小：4,114,065,529 字节。

| 分包 | 大小 | SHA-256 |
| --- | ---: | --- |
| [komorebi-checkpoint-part-01.zip](https://github.com/aa339519589-cpu/komorebi-temple-cinema/releases/download/checkpoint-2026-10-16/komorebi-checkpoint-part-01.zip) | 584,467,248 字节 | `512eaa0b5fa3c3e385d3708af6ae17b8f93ee0255f0feba6b9bcdb9704e56cef` |
| [komorebi-checkpoint-part-02.zip](https://github.com/aa339519589-cpu/komorebi-temple-cinema/releases/download/checkpoint-2026-10-16/komorebi-checkpoint-part-02.zip) | 510,353,241 字节 | `f0cb05f5c0db0899de3ab57ba511d4fde78fc518969e811ad2011a2aa7d3d94d` |
| [komorebi-checkpoint-part-03.zip](https://github.com/aa339519589-cpu/komorebi-temple-cinema/releases/download/checkpoint-2026-10-16/komorebi-checkpoint-part-03.zip) | 514,679,470 字节 | `08ff225568b124fa5bed709d3d26137f10d8abbaded0fe573b61905092c3bbe0` |
| [komorebi-checkpoint-part-04.zip](https://github.com/aa339519589-cpu/komorebi-temple-cinema/releases/download/checkpoint-2026-10-16/komorebi-checkpoint-part-04.zip) | 842,869,572 字节 | `a3dd073ba8a2cdc1ff096c5a5569a66359ee0b1a910ed93a59362bce47171a93` |
| [komorebi-checkpoint-part-05.zip](https://github.com/aa339519589-cpu/komorebi-temple-cinema/releases/download/checkpoint-2026-10-16/komorebi-checkpoint-part-05.zip) | 847,201,600 字节 | `f9bdfe1f7b883e7c6ca7e006c212a99156543867e87d2663cc69a7f66ad4d4bd` |
| [komorebi-checkpoint-part-06.zip](https://github.com/aa339519589-cpu/komorebi-temple-cinema/releases/download/checkpoint-2026-10-16/komorebi-checkpoint-part-06.zip) | 814,531,662 字节 | `b630823cf585efbcb76fc4f19694db78038b4310281b150fbb80dafcff575c2a` |

下载全部 ZIP 分包并解压到同一个空目录，即可恢复清单中所有原始路径。每个 ZIP 都可以独立打开。

核验工具：`python3 tools/verify-publication-local.py`，默认从 `.publication/` 读取下载的分包。

`local-verification.json` 核对 ZIP 内每个文件；`github-verification.json` 记录远端公开状态、源码提交和 GitHub 计算的各分包摘要。
