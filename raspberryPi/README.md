# Raspberry Pi

## Setup

1. [Downalod](https://downloads.raspberrypi.org/raspbian_lite_latest)
2. Write the image to a usb drive
3. Boot the pi
4. Login: pi | raspberry
5. `pi@raspberrypi:~ $ sudo raspi-config`
	* Localization > Change Keyboard layout > English US
	* Network > Wi-fi
	* Interfacing > SSH
6. `pi@raspberrypi:~ $ (echo aniedem; echo aniedem) | sudo passwd root`
7. `pi@raspberrypi:~ $ logout`
8. Login: root | aniedem
9. `root@raspberrypi:~# usermod -l medeina pi`
10. `root@raspberrypi:~# usermod -m -d /home/medeina medeina`
11. `root@raspberrypi:~# (echo ice; echo ice) | passwd medeina`
12. `root@raspberrypi:~# apt update && apt install -y git`
13. `root@raspberrypi:~# logout`
14. Login: medeina | aniedem
15. `medeina@raspberrypi:~ $ git clone https://github.com/fatlard1993/medeina`
16. `medeina@raspberrypi:~ $ ./medeina/raspberryPi/setup`