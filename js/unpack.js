const KPACK_PACKED_DATA_OFFSET = 12;
const LZMA_HEADER_SIZE = 14;

function unpack(kpack_data) {
    const kpack_header = {
        magic:          kpack_data.getUint32(0, true),
        unpack_size:    kpack_data.getUint32(4, true),
        flags:          kpack_data.getUint32(8, true),
    };
    
    if (kpack_header.flags != 1) {
        throw ("Unsupported compression type!");
    }

    const lzma_header = {
        props:          (2*5+0)*9+3,
        dict_size:      0x10000,
        unpack_size:    BigInt(kpack_header.unpack_size),
        zero:           0
    };

    while (lzma_header.dict_size < kpack_header.unpack_size) {
        lzma_header.dict_size<<=1;
    }

    let packed_data = new DataView(kpack_data.buffer, KPACK_PACKED_DATA_OFFSET);
    let lzma_data = new DataView(new ArrayBuffer(packed_data.byteLength + LZMA_HEADER_SIZE));

    lzma_data.setUint8(0, lzma_header.props)
    lzma_data.setUint32(1, lzma_header.dict_size, true)
    lzma_data.setBigUint64(5, lzma_header.unpack_size, true)
    lzma_data.setUint8(13, lzma_header.zero)

    // Byte swap
    let tmp = packed_data.getUint32(0, true);
    packed_data.setUint32(0, tmp, false);

    for (let i = 0; i < packed_data.byteLength; i++) {
        lzma_data.setUint8(i+LZMA_HEADER_SIZE, packed_data.getUint8(i));
    }

    unpack_array = LZMA.decompress(new Uint8Array(lzma_data.buffer));
    return new DataView(new Uint8Array(unpack_array).buffer);
}
