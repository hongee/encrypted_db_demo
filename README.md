Encrypted DB Portal Guide
======
### Setting up the VM (from Scratch/Development)
1. Install Vagrant `https://www.vagrantup.com/`
2. Install VirtualBox `https://www.virtualbox.org/wiki/Downloads`
  1. The VirtualBox VM image can be converted to one compatible with VMware using this guide: `https://kb.vmware.com/selfservice/microsites/search.do?language=en_US&cmd=displayKC&externalId=2053864`
3. `vagrant plugin install vagrant-vbguest`
4. Enter the `vm` folder and run `vagrant up`
5. Enter the vm using `vagrant ssh`
6. `cd app`
7. Load data into CryptDB using `load_data/load_files [data files directory]`

### Running the Portal
1. If using a pre-built VM, `cd dist`, `./start.sh`
  1. Server is available on `localhost:4567`
  2. Make sure the ports are forwarded from the VM to the host!
2. If running to develop, `cd app`, `./start.sh`
