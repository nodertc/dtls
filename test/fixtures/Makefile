# Source
ARCHIVE_GNUTLS=https://www.gnupg.org/ftp/gcrypt/gnutls/v3.5/gnutls-3.5.19.tar.xz
ARCHIVE_LIBTASN=https://ftp.gnu.org/gnu/libtasn1/libtasn1-4.13.tar.gz
ARCHIVE_NETTLE=https://ftp.gnu.org/gnu/nettle/nettle-3.4.tar.gz
ARCHIVE_GMPLIB=https://gmplib.org/download/gmp/gmp-6.1.2.tar.xz

# Build
ROOT_DIR=${PWD}
MAKE=make
CFLAGS="-O3 -I${ROOT_DIR}/build/include"
CONFIGURE=./configure CFLAGS=${CFLAGS} --build=none --host=none --prefix=${ROOT_DIR}/build --disable-shared
CURL=curl -s
EXTRACT_XZ=tar -xJ
EXTRACT_GZ=tar -xz
DTLSD_LIBS=-lgnutls -ltasn1 -lnettle -lhogweed -lgmp
DTLSD_LDFLAGS=-L${ROOT_DIR}/build/lib

all: dtlsd

dtlsd: build/lib/libgnutls.a build/lib/libgmp.a build/lib/libtasn1.a build/lib/libnettle.a
	gcc -Wall -I${ROOT_DIR}/build/include dtlsd.c ${DTLSD_LDFLAGS} ${DTLSD_LIBS} -o dtlsd

clean:
	rm -rf gnutls-3.5.19 gmp-6.1.2 nettle-3.4 libtasn1-4.13 build

# gmp

gmp-6.1.2/configure:
	${CURL} ${ARCHIVE_GMPLIB} | ${EXTRACT_XZ}

gmp-6.1.2/Makefile: gmp-6.1.2/configure
	cd gmp-6.1.2 && \
	${CONFIGURE} && \
	cd -

build/lib/libgmp.a: gmp-6.1.2/Makefile
	cd gmp-6.1.2 && ${MAKE} install && cd -

# libtasn1

libtasn1-4.13/configure:
	${CURL} ${ARCHIVE_LIBTASN} | ${EXTRACT_GZ}

libtasn1-4.13/Makefile: libtasn1-4.13/configure
	cd libtasn1-4.13 && \
	${CONFIGURE} \
		--disable-doc \
		--disable-valgrind-tests && \
	cd -

build/lib/libtasn1.a: libtasn1-4.13/Makefile
	cd libtasn1-4.13 && ${MAKE} install && cd -

# nettle

nettle-3.4/configure:
	${CURL} ${ARCHIVE_NETTLE} | ${EXTRACT_GZ}

nettle-3.4/Makefile: nettle-3.4/configure build/lib/libgmp.a
	cd nettle-3.4 && \
	${CONFIGURE} \
		LDFLAGS="-L${ROOT_DIR}/build/lib" \
		LIBS="-lgmp" \
		--enable-x86-aesni \
		--disable-openssl \
		--disable-documentation && \
	cd -

build/lib/libnettle.a: nettle-3.4/Makefile
	cd nettle-3.4 && ${MAKE} install && cd -

# gnutls

gnutls-3.5.19/configure:
	${CURL} ${ARCHIVE_GNUTLS} | ${EXTRACT_XZ}

gnutls-3.5.19/Makefile: gnutls-3.5.19/configure build/lib/libnettle.a build/lib/libtasn1.a build/lib/libgmp.a
	cd gnutls-3.5.19 && \
	${CONFIGURE} \
		NETTLE_CFLAGS="-I${ROOT_DIR}/build/include" \
		NETTLE_LIBS="-lnettle" \
		HOGWEED_CFLAGS="-I${ROOT_DIR}/build/include" \
		HOGWEED_LIBS="-lhogweed" \
		GMP_CFLAGS="-I${ROOT_DIR}/build/include" \
		GMP_LIBS="-lgmp" \
		LIBTASN1_CFLAGS="-I${ROOT_DIR}/build/include" \
		LIBTASN1_LIBS="-ltasn1" \
		--disable-maintainer-mode \
		--disable-doc \
		--disable-tools \
		--disable-cxx \
		--disable-padlock \
		--disable-ssl3-support \
		--disable-ssl2-support \
		--enable-sha1-support \
		--disable-tests \
		--disable-valgrind-tests \
		--disable-full-test-suite \
		--disable-rpath \
		--disable-libtool-lock \
		--disable-libdane \
		--without-p11-kit \
		--without-tpm \
		--with-included-unistring \
		--without-zlib \
		--without-libz-prefix \
		--without-idn \
		--with-system-priority-file="${HOME}/default-priorities" \
		&& \
	cd -

build/lib/libgnutls.a: gnutls-3.5.19/Makefile
	cd gnutls-3.5.19 && ${MAKE} install && cd -
