export type ViewId = 'discover' | 'search' | 'library' | 'playing'

export interface NavItem {
  id: ViewId
  label: string
  icon: string
}

export interface Track {
  id: number
  title: string
  artist: string
  album: string
  duration: string
  seconds: number
  artwork: string
  liked: boolean
  lyrics: string[]
}

export interface Playlist {
  title: string
  subtitle: string
  artwork: string
}

export interface Album {
  title: string
  meta: string
  artwork: string
}

export interface Collection {
  title: string
  subtitle: string
  artwork: string
}

export const navItems: NavItem[] = [
  { id: 'discover', label: 'Discover', icon: '◎' },
  { id: 'search', label: 'Search', icon: '⌕' },
  { id: 'library', label: 'Library', icon: '▣' },
  { id: 'playing', label: 'Playlists', icon: '≡' },
]

export const heroArtwork =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCy0SnpoLn5TvnsxRdTwfbU1yb55Crh2mcB8CtGGkRtqI9GkV0kqh7Vwp0EOEQEFhhxD2-gaLjgCrhRrMsD749ufFCznXesO22IZpugnCRcttxm36v9FugeXTZ2N7exqGYBxoMdW4-4AVp5t6eD_TiBK-eL2JQKiqGKDyqLvBMh9hvmKYNWJ30XojsraDJDGzezMgXTl2joWVEPLe8QLqUYf39LpPBnKsm1U--4zO7ikA93ndxk17jNmYsM6DPaGf8BeQxH_ZsdxBcv'

export const profileArtwork =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB8E7c4A-R4ZiBPeDjnAgaEVrctuNRvZDYP-PRDeIiPvKKCbMn5YEMUWoGBxYRqMHy7KIiji5luf4XS2U-_9CjoVy6WAxMmYL8eZBATVLE6K2_OAevio0uodE3ExPKpRFNNSABlZMzjcaGu0RpLpjW4wLXIfZ-WiNyvz52X5TMDzoOrbYSx0ME3DrRGv6CJCllQTKdotoKcOJ44F7xmfHEOHZskLSw6dP-5WL97j18Z2LVRp-UXCNhRiHZzlee3JnerGbo1nP11kTSI'

export const tracksSeed: Track[] = [
  {
    id: 1,
    title: '午后咖啡馆',
    artist: 'Lofi Dreams',
    album: 'Urban Beats Vol. 1',
    duration: '3:42',
    seconds: 222,
    artwork:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCbvfLB947p3_N4iarE8rpA1cnY7ReBxj2exnlMdAkIwvvCj2z-L7zK44CG1M9tlPj7MAcHjVEThPf6FNutzQ-BPLW9U1nm5KvW6fSpSa67B-gvEKJfgS3DWDXoNHz2vjcJbqokWzWGgB3RaKxN1UT7us3nv-4vm7WYCxdpoOIrwsreQ8uT_I2jpRUVeyPTOGc8Y8h0rD6xD3xImmoTC1nn0-2une0L-r921jWc_t2X7pdAtBL3U0rIkBXfQVL7HH0JKEY5HxKTRB0i',
    liked: true,
    lyrics: ['当霓虹灯火渐渐熄灭', '街道在雨后闪着微光', '我们在旋律中寻找失去的梦', '时间在这一刻凝固成永恒', '星空下的独白只有心跳回应'],
  },
  {
    id: 2,
    title: '雨天的窗台',
    artist: 'Rainy Vibes',
    album: 'Nature Sounds',
    duration: '4:15',
    seconds: 255,
    artwork:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC8h2Ai3NwVNMgTITjbUPbNHYcd0jYHrn4HEC-0ExwjwQult9BHQLdg693enuC_91zgFjm5UFVLBZtEuAGixE_KZhW3zgfoVGAXOL0eqC_cD_mvByf9qtT0FQ__dT0wxarjvBGbQtDpeBkb92e8LTDxcvpIudMpG2YWWbupIq6D2Ahv8gmfyJQh4s7gqx-fU6Z_EryNoBL8z3HoGKrIXoj6pWStaGM2ukVI7YFSywPAeQ2yCtq73aR-HJ7C9S9fB7SG9wbX545vdw37',
    liked: false,
    lyrics: ['雨滴落在透明玻璃', '旧唱片轻轻转动', '城市把喧哗藏进伞下', '你说安静也有温度', '旋律沿着窗沿流向远处'],
  },
  {
    id: 3,
    title: '星空下的低语',
    artist: 'Night Walker',
    album: 'Midnight Session',
    duration: '2:58',
    seconds: 178,
    artwork:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAXhy7jKw2AqGOe_75_IP3rsOMS4XuWInfOtynrZw0sjIwXputNWeb0WqEDJDnKSN7kKhvnyGut5kCiPsptAQOQAMVKHalxjUeu3O5gBtMJi5n9grNByw3KE4YQKLttJ_iAKixwHGaLblruLtAhaJ7CPvCGHCKR3kMQzr1buc7By62OC76HYLHkQapgwAqjbJ9ZG5_8nru3KANqHHuJVQZBJjZ9yNriP5bojAsay_v77BH_005_itPnHDdsqKqS6LyVR2fxVF8gOwbL',
    liked: true,
    lyrics: ['夜色把灯影铺成河', '脚步声慢慢变轻', '远处的风带来一段合声', '每个停顿都像一次呼吸', '在低语里听见完整的自己'],
  },
  {
    id: 4,
    title: '晨间慢跑',
    artist: 'Morning Glow',
    album: 'Daily Energy',
    duration: '3:20',
    seconds: 200,
    artwork:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDJqa-SsYoCwkFJjhAok3dtpAVlePRO8dthAQ8iZDyxCowBbtg72zN0JhhJoN8YLQYd9BaWKsRqP3ZwWpqiCbgtgAaDzlisO1Zx5RX7D7ijPOblmcvkQUkDhcUX28MDpVj_9ZX6Lcog6cft9UBn7HUBtTHyHe7GzQB1b9joL8pvUlR75NEtvx99ljDH2j05fPAQ6rV_6GFjvyQj5VKqXNo0hXBsvc_jYak-SV2fWWrsRWx6QnspRmyFJPxVFCV_rowW_3OST0RH3ueW',
    liked: false,
    lyrics: ['第一束光越过街角', '节拍推着呼吸向前', '鞋底和路面交换清晨', '醒来的城市还很柔软', '今天从一段鼓点开始'],
  },
  {
    id: 5,
    title: '午夜飞行',
    artist: '落日飞车',
    album: 'Sunset Rollercoaster',
    duration: '3:45',
    seconds: 225,
    artwork:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBbBxwZRbai4rZI11IECZv79s6cFkccDm-2PFrFwyUY1krwxTkBi1Xjf-g6yXIoKSqFIFmUeNtNoUQT8aH-AZX4GtEbYQwiCQyi5n8Nqwt8XCEzbzl_-paUdtzcRc1E4u_6jER7DMzNjfoCT9qMOUALDKMBIo_UOfF2hwHWpGfWMo0ws0MZ0h6WZg_WgFQyiZH9NFPCGZNKA7kfSr1NV2RnAlyTTnRVpV6XYKhfFUWP2JlHGTYcpBItCVKIwpzVwtZuROniqIvTAgpN',
    liked: true,
    lyrics: ['引擎声穿过午夜云层', '城市在脚下闪烁成星', '我们把明天暂时关小声', '只让贝斯线继续飞行', '降落前记住这一秒'],
  },
  {
    id: 6,
    title: '节奏城市',
    artist: 'Various Artists',
    album: 'Rhythm City',
    duration: '2:58',
    seconds: 178,
    artwork:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCXCLub0y1mqpCoHOmUF4DA2fSwdYMQqQyUBqDuIvJSp1-TIxPSY9uvuXhALGSjSTVvKTH8VkYalCNlbvgE3cJqZNe6driRDUXpian5lxwoYrMzadsk5YeP1_4t_7sKopmLathVMDrQ5S-PDVk3P2p2uGWkxSve-HPH14v1JlhvwyhNb-DZ6em-EX6uO5KVu3eCxxozuk5GP990uzvw2nKWKRByVq_iZeUUs3DQyYfGIDZ_tGHUaNym53LKCdd27eHr2Xi4yQTGIxFY',
    liked: false,
    lyrics: ['红灯切换成新的鼓点', '人群在转角处汇合', '每扇窗都有不同拍号', '霓虹把夜晚调成高亮', '节奏让城市保持清醒'],
  },
]

export const playlists: Playlist[] = [
  {
    title: '晨间律动',
    subtitle: '由 Music App 编辑',
    artwork:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBWJn1SscvsATlg2VqdR97f-sDv1o9DOC5_A_hDUiekHT_HaWpSKvtnNpcpY-NekXiGqp99etEITqKJ1FLqnflKaYKQ-tJL1LXLW3HIHK_ljfWO4f-VvwPBp3nFVLxazHNUrjVazJnFDLbydHtlCMU4XIxY39QFEQSGDuNFxc9TBm358m5Qh_I_j5wKqHfmcUcuD2OPkAfrBuSCKo-nv0vjcL9NF79kTyW3QyjbVUNRbYG0r5-ZdihE-WloiqZ-f0SWhBYFNmbtkfSL',
  },
  {
    title: '专注时刻',
    subtitle: '精选环境音乐',
    artwork:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAKVcdsFnZSll_9jVF3P8kLrCgsKI3R95b5jrPd_VyNLp0LDXERmhL2PXO-T1VX5cgNXRHmiSLy5h-Q02MPrhWfcQmAYVMpu5OMQCzz_1EGUV2LgkgGnUfERCahMqqtjotB9WTGbNDNcR2aWI7qrf5zDrGYTha-_HVOL2vFrrXjAbzy8HkGVtt4soNfaMiwiMcGQn389JPmdmd3NPPa1py9C54e1PSED7oRW558_p-IpW1b385UCkN54Twl10JNJRIeA73oTTCCnlPL',
  },
  {
    title: '周末聚会',
    subtitle: '最热流行电音',
    artwork:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDzrm1TbGSeEY7y3Ymk1_3j80EJctvMg_VFptBYVrrM623nMYMVkpyXJDVPFFLvJYqBOep8t0f0NL6C9V_lqK4ENSySxCpx47sA12eYUUM3eJjeghKJVRp6n1R8Nv0qG5UOBhrwOX5LKCjtsz0Lwl0Yd9FwYtKYAWUrwCOd49j8JomIEFSKSfWWAsBUoqE-j_q-PfNkKM3y2AS3535OWEerZoDuV5xLzkXYfv9RaGNIu-c8dpWnDyIK-BYW6qALEfKYTvWH4kpsLK24',
  },
  {
    title: '原声回响',
    subtitle: '不插电精选',
    artwork:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB2dBiI741ArILqY05Wbjwpc-p9v1Llsw4fABJH-nT60_e6Gvjjar9WjhUGvHXqpEn0RLK9aHw7lc_3BTCxnEHrv1pVqiqS0Av6QY2VCn6eChwpuoUHWmhMLJDR4eVzAA6IW-A3U_E38eZ98qwVbgenJskLaSmpWZPG2go4Dkpy0BgghrevtdRgDlwDmIu8PpOhRdKclkaBlzIct7vbKy2dtAu7AkZkstXVMHAOtsjyKmoTCgtX6Sn6MxMfbw13Fa7NBBK7o8hYkTYT',
  },
  {
    title: '经典怀旧',
    subtitle: '重温黄金时代',
    artwork:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAA1gQwW656Q2FSDUNKoHuqjemQfDmrC9I40hP4S0A02qr6ptb_DoQJx8ftksjYsP33m8ND2F3pxr4g03nyWwDw3xEfg7UubNqgxRuz-JgaYR-eCwNT5jnZfm0yhlCto9tf2INUSHk4EtKDgEGeArMVIk1SwCtAEmkhYlnlR6lMccpm2IaqiN9NygIHmcTPtmb234x_AA4vn5lwjCr_d0vQJhwPaLnYW8fslkHue0wd-D1YNHVs3U9jI8nQHZ3nEDovbCwPnW-qL9t1',
  },
]

export const albums: Album[] = [
  { title: '离幻之城', meta: '2024 · 12 首', artwork: playlists[0].artwork },
  { title: '昨日重现', meta: '复古波', artwork: tracksSeed[1].artwork },
  { title: '极光之下', meta: '北极圈', artwork: tracksSeed[3].artwork },
]

export const collections: Collection[] = [
  {
    title: '年度爵士精选',
    subtitle: '听见萨克斯的风情',
    artwork:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD6Sqc0YerH3zoELpVAG5-jUaGHZBffXIxAIG-7j2p1bdnHLmX8jOuGD9ZHnXVZuU680CRMGI8DgCeaP19ENJ81P9vfSje-MOCzJ1hatlUfiOCFbAKEi4PzWrgFP3xhLbRVeEyS0Ym2CdWBkDpmThHvuVdjbAj6ISP3uroO0mEkNPGMz_gbaIw1H3dDunWjkaPZsFN76AbbOJ8owvOJW0MuEHuuYshJ8yaFSLMBSBMQTzjJgxVhpNmQikcv_nKakIcSuooKW3FjWryv',
  },
  {
    title: '电子梦境',
    subtitle: '深夜灵魂的节奏',
    artwork:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC4uJ-FnYn1hBtk6QC9nbqY7Yd_Rv6TembcXNK43nAViBLr3axZvidkyMcVTMPOfwq14Y5j_NIDYVc9XEa4sLD5JgfAeM_50bfbHVfBeUEYpUIoTm5vu2ang0Krg9ZSsfZ0InLbk5Fo22V_xcHkQvtqRZlskuEywpiSQug8T9QrTJR0mapsMztlxgFf9XechLOG1atpWtCSk6HdF6-wzqY9mZjq3ZiCWzhGYU2vfsmSeCCOyc0M3nKvqnfOvTsr5oSS8KsBLOVvYmlg',
  },
  {
    title: '独立音乐现场',
    subtitle: '来自地下最真实的声音',
    artwork:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBOsY3fs2nbT2-ZhkXBBuINzpq15EiMswEOzeSDN8YyNmYlw1H5QSQaJXleLCK2MRJx1iUyrA2tBJzRaWV5xQgg_xARGFBUc4syEwyzGeezFy5U-IgqK5PZ7OfTTB71Av6j1EZhXyGatpFppLQxkEdxLirn5z4frJMg3irJoNWi7Iw4dxCPgSNGenCra5nU62u5J28TPdkwRCqgT80IB1MeyPnD7KoctJnV87QFcY3Bu3R28rtSwqKGO4-TNuPQ6nfy6MnpzhpXXDNc',
  },
]
