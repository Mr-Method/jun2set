[![Stand With Ukraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/banner2-direct.svg)](https://vshymanskyy.github.io/StandWithUkraine/)


# jun2set
Представляю свою реалізацію конвертора бекапів конфігурацій вендора Juniper.

Я часто користувався схожим інструментом за посиланням http://www.stewartb.com/cgi-bin/juniper.pl
, але нажаль, він більше не працює, а автор не відповідає на листи.
Саме тому я вирішив знайти альтернативу, але всі вони або давно закинуті і мають проблеми, або виконані у вигляді консольних команд, що менш зручно в порівнянні з on-line інструментом.

Не знайшовши on-line алтернативи, вирішив реалізувати свій варіант. Спочатку було зроблено також на мові програмування perl, але згодом я вирішив переробити його на javascript, що значно полегшить інтеграцію даного інструменту в різні онлайн сервіси.

Працездатність перевірено на резервних копіях обладнання Juniper серії MX. Результати конвертора звірено з рідним виводом команди ```show | display omit | display set | no-more``` того ж обладнання.

## Відомі баги :beetle:
Деякі блоки конфігурації конвертуються в один рядок, хоча вивід команди ```show | display set | no-more``` того ж блоку виводить в кілька рядків, наприклад:
```
system {
    processes {
        general-authentication-service {
            traceoptions {
                file gas.log size 10k files 3;
                flag all;
            }
        }
    }
}
```
конвертує в 2 рядки
```
set system processes general-authentication-service traceoptions file gas.log size 10k files 3
set system processes general-authentication-service traceoptions flag all
```
а вивід display set виводить 4 рядки
```
set system processes general-authentication-service traceoptions file gas.log
set system processes general-authentication-service traceoptions file size 10k
set system processes general-authentication-service traceoptions file files 3
set system processes general-authentication-service traceoptions flag all
```
Швидкого рішення я не знайшов, крім того команди з конвертера працюють належним чином, тому лишаю як є.  

## Допомога
Моя стихія це бекенд на Perl, верстка - це не моє :stuck_out_tongue_winking_eye:, тому будь-якє вдосконалення верстки чи коду конвертера вітаються!

Не прошу фінансової допомоги, а прошу допомоги у вдосконаленні інструменту.
