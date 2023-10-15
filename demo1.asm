;
; Special locations
; (they work with LDA/STA abs only!)
;
set_palette = $FF00 ; W: sets current index
write_color = $FF01 ; W++: R, G or B
set_row     = $FF02 ; W: pixel row
set_col     = $FF03 ; W: pixel col
write_pixel = $FF04 ; W++: writes a pixel

random      = $FF80 ; R: a random byte
clock0      = $FF81 ; R: updates clock and returns low byte
clock1      = $FF82 ; R: returns second byte of clock
clock2      = $FF83 ; R: returns third byte of clock
clock3      = $FF84 ; R: returns fourth byte of clock

mouse_b     = $FF85 ; R: mouse buttons (bits 0/1/2) or 255 if outside
mouse_x     = $FF86 ; R: mouse x position (0 if outside)
mouse_y     = $FF87 ; R: mouse y position (0 if outside)

;
; Execution begins at "start" and stops when
; program counter becomes $0000
;
    .org $0200
    .db $0c, $02, $35, $02, $6a, $02, $a1, $02, $e0, $02, $5b, $03, $ff, $00, $6f, $05
    .db $1a, $07, $19, $07, $19, $07, $19, $07, $1a, $05, $1c, $03, $1c, $05, $1a, $07
    .db $18, $09, $19, $05, $1b, $05, $1a, $07, $19, $07, $18, $09, $17, $09, $17, $09
    .db $18, $07, $17, $0b, $4a, $ff, $00, $2a, $03, $01, $06, $01, $03, $12, $03, $01
    .db $06, $01, $03, $12, $0e, $12, $0e, $12, $0e, $12, $0e, $12, $0e, $13, $0c, $16
    .db $08, $18, $08, $17, $0a, $16, $0a, $16, $0a, $16, $0a, $15, $0c, $14, $0c, $14
    .db $0c, $14, $0c, $13, $0e, $12, $0e, $12, $0e, $49, $b0, $01, $1f, $02, $1e, $03
    .db $1c, $05, $1a, $07, $18, $09, $16, $0b, $14, $0c, $13, $0d, $12, $0e, $11, $0f
    .db $12, $06, $01, $07, $13, $01, $04, $08, $16, $0a, $14, $0c, $13, $0c, $14, $0c
    .db $13, $0d, $13, $0d, $13, $0d, $14, $0c, $14, $0d, $12, $0e, $11, $10, $10, $10
    .db $48, $4f, $02, $1e, $02, $1d, $04, $1b, $06, $19, $07, $19, $06, $02, $01, $16
    .db $06, $02, $02, $16, $05, $02, $03, $16, $0a, $17, $08, $18, $08, $1a, $04, $1b
    .db $06, $18, $0a, $15, $0c, $17, $06, $19, $08, $18, $08, $18, $08, $17, $0a, $16
    .db $0a, $16, $0a, $15, $0c, $14, $0c, $14, $0c, $14, $0c, $15, $0a, $13, $10, $48
    .db $cc, $02, $04, $02, $17, $04, $02, $04, $16, $04, $02, $04, $12, $02, $03, $02
    .db $04, $02, $03, $02, $0d, $04, $03, $01, $04, $01, $03, $04, $0c, $04, $03, $02
    .db $02, $02, $03, $04, $0d, $02, $04, $06, $04, $02, $0f, $02, $03, $06, $03, $02
    .db $10, $04, $01, $06, $01, $04, $0c, $02, $02, $10, $02, $02, $07, $04, $02, $0e
    .db $02, $04, $06, $04, $02, $0e, $02, $04, $07, $02, $01, $12, $01, $02, $0a, $14
    .db $0c, $14, $0d, $12, $0e, $12, $0e, $08, $02, $08, $0f, $01, $0e, $01, $10, $06
    .db $01, $02, $01, $06, $10, $01, $01, $02, $03, $02, $03, $02, $01, $01, $10, $06
    .db $01, $02, $01, $06, $10, $01, $0e, $01, $10, $10, $48, $8f, $02, $1e, $02, $1c
    .db $06, $1a, $06, $14, $04, $04, $02, $04, $04, $0c, $09, $01, $02, $01, $09, $09
    .db $18, $08, $03, $03, $0c, $03, $03, $07, $03, $05, $0a, $05, $03, $06, $03, $06
    .db $08, $06, $03, $06, $03, $02, $01, $01, $01, $02, $06, $02, $01, $01, $01, $02
    .db $03, $06, $03, $03, $01, $04, $04, $04, $01, $03, $03, $06, $04, $01, $01, $01
    .db $01, $03, $04, $03, $01, $01, $01, $01, $04, $07, $04, $03, $0a, $03, $04, $08
    .db $05, $02, $0a, $02, $05, $08, $06, $01, $0a, $01, $06, $09, $08, $01, $04, $01
    .db $08, $0b, $08, $04, $08, $0d, $07, $01, $02, $01, $07, $0e, $06, $01, $01, $02
    .db $01, $01, $06, $0f, $01, $0e, $01, $10, $06, $01, $02, $01, $06, $10, $01, $01
    .db $02, $03, $02, $03, $02, $01, $01, $10, $06, $01, $02, $01, $06, $10, $01, $0e
    .db $01, $10, $10, $48

;; Box drawing parameters
x0    = $00
y0    = $01
x1    = $02
y1    = $03
color = $04

;; Animated square position and speed
sqx   = $05
sqy   = $06
sqdx  = $07
sqdy  = $08

;; Line drawing
dx    = $09
dy    = $0A
ix    = $0B
iy    = $0C
cx    = $0D
cy    = $0E
m     = $0F

;; Counter
count_l = $10
count_h = $11

;; Chess piece definition reader
cpdr_l = $12
cpdr_h = $13

;; Current and old current square on chessboard, secondary square
bcsq = $15
obcsq = $16
bcsq2 = $17

;; Secondary color (foreground) for piece drawing
color2 = $18

;; Draws a line from x0, y0 to x1, y1
drawline:
    ; dx/ix computation
    ldx #$01
    lda x1
    sec
    sbc x0
    bcs dlxpos
    eor #$FF
    sbc #$FE
    ldx #$FF
dlxpos:
    sta dx
    stx ix

    ; dy/iy computation
    ldx #$01
    lda y1
    sec
    sbc y0
    bcs dlypos
    eor #$FF
    sbc #$FE
    ldx #$FF
dlypos:
    sta dy
    stx iy

    ; m/cx/cy computation
    lda dx
    cmp dy
    bcs dlxm
    lda dy
dlxm:
    sta m
    tay
    bne dlsome
    rts
dlsome:
    lsr a
    sta cx
    sta cy

    ; main loop
dlloop:
    lda x0
    sta set_col
    lda y0
    sta set_row
    lda color
    sta write_pixel

    ; x-inc
    lda cx
    clc
    adc dx
    sta cx
    bcs dlxi
    cmp m
    bcc dlnoxi
dlxi:
    lda x0
    clc
    adc ix
    sta x0
    lda cx
    sec
    sbc m
    sta cx
dlnoxi:

    ; y-inc
    lda cy
    clc
    adc dy
    sta cy
    bcs dlyi
    cmp m
    bcc dlnoyi
dlyi:
    lda y0
    clc
    adc iy
    sta y0
    lda cy
    sec
    sbc m
    sta cy
dlnoyi:

    dey
    bne dlloop
    rts


;; Fills a box with a solid color
fillbox:
    lda y0
    sta set_row
    lda x0
    sta set_col
    lda x1
    sec
    sbc x0
    tax
    lda color
fbxloop:
    sta write_pixel
    dex
    bne fbxloop
    inc y0
    lda y0
    cmp y1
    bne fillbox
    rts

;; Sets square coordinates for bouncing animation
set_square:
    lda sqx
    clc
    adc #$08
    sta x0
    clc
    adc #$10
    sta x1
    lda sqy
    clc
    adc #$08
    sta y0
    clc
    adc #$10
    sta y1
    rts

;; Draw chessboard
drawboardsquare:
    lda #$00
    sta set_palette
    sta write_color
    sta write_color
    sta write_color
    lda #$FF
    sta write_color
    sta write_color
    sta write_color
    lda #$AA
    sta write_color
    lda #$BB
    sta write_color
    lda #$CC
    sta write_color
    lda #$77
    sta write_color
    lda #$88
    sta write_color
    lda #$99
    sta write_color
    lda #$FF
    sta write_color
    lda #$00
    sta write_color
    sta write_color
    lda #$C0
    sta write_color
    lda #$00
    sta write_color
    sta write_color
    lda sqx
    asl a
    asl a
    asl a
    asl a
    asl a
    sta x0
    adc #$20
    sta x1
    lda sqy
    asl a
    asl a
    asl a
    asl a
    asl a
    sta y0
    adc #$20
    sta y1
    lda sqy
    asl a
    asl a
    asl a
    adc sqx
    cmp bcsq
    bne nocurr
    lda #$04
    bne drawsq
nocurr:
    cmp bcsq2
    bne nocurr2
    lda #$05
    bne drawsq
nocurr2:
    lda sqx
    eor sqy
    and #$01
    clc
    adc #$02
drawsq:
    sta color

    lda sqy
    asl a
    asl a
    asl a
    adc sqx
    tax
    lda chesspos,x
    bne notempty
    jmp fillbox
notempty:
    tax
    and #$08
    lsr a
    lsr a
    lsr a
    eor #$01
    sta color2
    dex
    txa
    and #$07
    asl a
    tax
    lda $0200,x
    sta cpdr_l
    lda $0201,x
    sta cpdr_h

    lda sqx
    asl a
    asl a
    asl a
    asl a
    asl a
    sta x0
    lda sqy
    asl a
    asl a
    asl a
    asl a
    asl a
    sta y0

    ldy #$FF
    lda color2
    sta count_h

loadrun:
    lda count_h
    eor color
    eor color2
    sta count_h
    iny
    lda (cpdr_l),y
    sta count_l
    beq loadrun
proc1:
    lda y0
    sta set_row
    lda x0
    sta set_col
    lda count_h
    sta write_pixel
    inc x0
    lda x0
    cmp x1
    bne noy
    lda sqx
    asl a
    asl a
    asl a
    asl a
    asl a
    sta x0
    inc y0
    lda y0
    cmp y1
    bne noy
    rts
noy:
    dec count_l
    bne proc1
    jmp loadrun

drawboard:
    lda #$00
    sta sqx
    sta sqy
drawboard2:
    jsr drawboardsquare
    inc sqx
    lda sqx
    eor #$08
    bne drawboard2
    sta sqx
    inc sqy
    lda sqy
    cmp #$08
    bne drawboard2
    rts

;; Main program
start:
    ; clear screen to random
    lda #$00
    tax
    tay
cloop:
    lda random
    sta write_pixel
    dex
    bne cloop
    dey
    bne cloop

    ; draw 2048 random lines
    ldy #$08
    ldx #$00
cloop2:
    txa
    pha
    tya
    pha
    lda random
    sta x1
    lda random
    sta y1
    tya
    sta color
    jsr drawline
    pla
    tay
    pla
    tax
    dex
    bne cloop2
    dey
    bne cloop2

    ; Set a green-red bouncing palette
    lda #$00
    sta set_palette
    ldx #$00
ploop1:
    txa
    sta write_color
    eor #$FF
    sta write_color
    lda #$00
    sta write_color
    inx
    inx
    bne ploop1
ploop2:
    txa
    eor #$FF
    sta write_color
    eor #$FF
    sta write_color
    lda #$00
    sta write_color
    inx
    inx
    bne ploop2

    ; Set starting position and speed
    lda #$01
    sta sqx
    sta sqy
    sta sqdx
    sta sqdy
    lda #$00
    sta count_l
    sta count_h
mainloop:
    ; Increment square position
    lda sqx
    clc
    adc sqdx
    cmp #$DF
    bcc xok
    lda sqdx
    eor #$FF
    sta sqdx
    inc sqdx
    lda sqx
xok:
    sta sqx
    lda sqy
    clc
    adc sqdy
    cmp #$DD
    bcc yok
    lda sqdy
    eor #$FF
    sta sqdy
    inc sqdy
    lda sqy
yok:
    sta sqy

    ; Draw square
    jsr set_square
    inc color
    jsr fillbox

    inc count_l
    bne mainloop
    inc count_h
    bne mainloop

    ; Chessboard
    lda #$FF
    sta bcsq
    sta obcsq
    sta bcsq2
    jsr drawboard

mouseloop:
    ldx #$00
    lda mouse_b
    cmp #$FF
    beq setsq
    tax
    lda mouse_y
    and #$E0
    lsr a
    lsr a
    sta bcsq
    lda mouse_x
    lsr a
    lsr a
    lsr a
    lsr a
    lsr a
    clc
    adc bcsq
setsq:
    sta bcsq
    cpx #$01
    bne noclick
    tax
waitup:
    lda mouse_b
    cmp #$01
    beq waitup
    txa
    ldy bcsq2
    cpy #$FF
    beq nomove
    cpx bcsq2
    beq updated
    lda chesspos,y
    sta chesspos,x
    lda #$00
    sta chesspos,y
updated:
    lda #$FF
    sta bcsq2
    sta bcsq
    sta obcsq
    jsr drawboard
    jmp mouseloop
nomove:
    sta bcsq2
noclick:
    lda bcsq
    cmp obcsq
    beq mouseloop
    lda obcsq
    cmp #$FF
    beq no_clear_old
    and #$07
    sta sqx
    lda obcsq
    lsr a
    lsr a
    lsr a
    sta sqy
    jsr drawboardsquare
no_clear_old:
    lda bcsq
    sta obcsq
    cmp #$FF
    beq no_draw_new
    and #$07
    sta sqx
    lda bcsq
    lsr a
    lsr a
    lsr a
    sta sqy
    jsr drawboardsquare
no_draw_new:
    jmp mouseloop

    jmp $0000

chesspos:
    .db $0a, $0b, $0c, $0d, $0e, $0c, $0b, $0a
    .db $09, $09, $09, $09, $09, $09, $09, $09
    .db $00, $00, $00, $00, $00, $00, $00, $00
    .db $00, $00, $00, $00, $00, $00, $00, $00
    .db $00, $00, $00, $00, $00, $00, $00, $00
    .db $00, $00, $00, $00, $00, $00, $00, $00
    .db $01, $01, $01, $01, $01, $01, $01, $01
    .db $02, $03, $04, $05, $06, $04, $03, $02
